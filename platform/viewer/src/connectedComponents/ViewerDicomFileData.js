import React, { Component } from 'react';
import { metadata, utils } from '@ohif/core';
import qs from 'querystring';

import ConnectedViewer from './ConnectedViewer.js';
import PropTypes from 'prop-types';
import { extensionManager } from './../App.js';
import filesToStudies from '../lib/filesToStudies';
import NotFound from '../routes/NotFound';

const { OHIFStudyMetadata } = metadata;
const { studyMetadataManager } = utils;

class ViewerDicomFileData extends Component {
  static propTypes = {
    studies: PropTypes.array,
  };

  state = {
    studies: null,
    loading: false,
    error: null,
  };

  static propTypes = {
    location: PropTypes.object,
  };

  updateStudies = studies => {
    // Render the viewer when the data is ready
    studyMetadataManager.purge();

    // Map studies to new format, update metadata manager?
    const updatedStudies = studies.map(study => {
      const studyMetadata = new OHIFStudyMetadata(
        study,
        study.StudyInstanceUID
      );
      const sopClassHandlerModules =
        extensionManager.modules['sopClassHandlerModule'];

      study.displaySets =
        study.displaySets ||
        studyMetadata.createDisplaySets(sopClassHandlerModules);

      studyMetadata.forEachDisplaySet(displayset => {
        displayset.localFile = true;
      });

      studyMetadataManager.add(studyMetadata);

      return study;
    });

    this.setState({
      studies: updatedStudies,
    });
  };

  fetchDataFromApi = async dataUrl => {
    let numObjects = dataUrl.searchParams.get('number_of_objects');
    let objString = Array.from(
      { length: numObjects },
      (_, i) => '&object[i]=' + dataUrl.searchParams.get('object[i]')
    );
    let targetUrl = dataUrl.href + objString;

    let response = await fetch(targetUrl);
    let result = await response.json();

    let image_urls = [];
    result.series.map(series => {
      series.image_url = series.image_url.map(
        instance_url =>
          dataUrl.searchParams.get('hostLocationOrigin') + instance_url
      );
      image_urls = image_urls.concat(series.image_url);
    });

    let files = await Promise.all(
      image_urls.map(async image_url => {
        let response = await fetch(image_url);
        if (response.status == 200) {
          let file = await response.blob();
          return file;
        }
      })
    );
    return files;
  };

  async componentDidMount() {
    try {
      let { search } = this.props.location;
      let url = new URL(search.split('?dicomlist=')[1]);

      let files = await this.fetchDataFromApi(url);

      this.setState({ loading: true });

      const studies = await filesToStudies(files);
      this.updateStudies(studies);

      this.setState({ studies: studies, loading: false });
    } catch (error) {
      this.setState({ error: error.message, loading: false });
    }
  }

  render() {
    const message = this.state.error
      ? `Error: ${JSON.stringify(this.state.error)}`
      : 'Loading...';
    if (this.state.error || this.state.loading) {
      return <NotFound message={message} showGoBackButton={this.state.error} />;
    }

    return this.state.studies ? (
      <ConnectedViewer
        studies={this.state.studies}
        studyInstanceUIDs={
          this.state.studies && this.state.studies.map(a => a.StudyInstanceUID)
        }
      />
    ) : (
      <div>
        <h3>No data available for the Viewer</h3>
      </div>
    );
  }
}

export default ViewerDicomFileData;
