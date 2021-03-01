import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Select, Typography, Button, HotkeysPreferences } from '@ohif/ui';
import { useTranslation } from 'react-i18next';

const UserPreferences = ({ availableLanguages, defaultLanguage, currentLanguage, disabled, hotkeyDefinitions, hotkeyDefaults, onCancel, onSubmit, onReset }) => {
  const { t } = useTranslation('UserPreferencesModal');
  const [state, setState] = useState({
    isDisabled: disabled,
    hotkeyErrors: {},
    hotkeyDefinitions,
    language: currentLanguage
  });

  const onSubmitHandler = () => {
    onSubmit(state);
  };

  const onResetHandler = () => {
    setState(state => ({
      ...state,
      language: defaultLanguage,
      hotkeyDefinitions: hotkeyDefaults,
      hotkeyErrors: {},
      isDisabled: disabled,
    }));
    onReset();
  };

  const onCancelHandler = () => {
    setState({ hotkeyDefinitions });
    onCancel();
  };

  const onLanguageChangeHandler = (value) => {
    setState(state => ({ ...state, language: value }));
  };

  const onHotkeysChangeHandler = (id, definition, errors) => {
    setState(state => ({
      ...state,
      isDisabled: Object.values(errors).every(e => e !== undefined),
      hotkeyErrors: errors,
      hotkeyDefinitions: {
        ...state.hotkeyDefinitions,
        [id]: definition,
      }
    }));
  };

  const Section = ({ title, children }) => (
    <>
      <div className="border-b-2 border-black mb-2">
        <Typography
          variant="h5"
          className="flex flex-grow text-primary-light font-light pb-2"
        >
          {title}
        </Typography>
      </div>
      <div className="mt-4 mb-8">
        {children}
      </div>
    </>
  );

  return (
    <div className="p-2">
      <Section title="General">
        <div className="flex flex-row justify-center items-center w-72">
          <Typography variant="subtitle" className="mr-5 text-right h-full">
            Language
          </Typography>
          <Select
            isClearable={false}
            onChange={onLanguageChangeHandler}
            options={availableLanguages}
            value={state.language}
          />
        </div>
      </Section>
      <Section title="Hotkeys">
        <HotkeysPreferences
          disabled={disabled}
          hotkeyDefinitions={state.hotkeyDefinitions}
          onChange={onHotkeysChangeHandler}
          errors={state.hotkeyErrors}
        />
      </Section>
      <div className="flex flex-row justify-between">
        <Button variant="outlined" onClick={onResetHandler} disabled={disabled}>
          {t('Reset to Defaults')}
        </Button>
        <div className="flex flex-row">
          <Button variant="outlined" onClick={onCancelHandler}>
            {t('Cancel')}
          </Button>
          <Button
            variant="contained"
            disabled={state.isDisabled}
            color="light"
            className="ml-2"
            onClick={onSubmitHandler}
          >
            {t('Save')}
          </Button>
        </div>
      </div>
    </div>
  );
};

const noop = () => { };

UserPreferences.propTypes = {
  disabled: PropTypes.bool,
  hotkeyDefaults: PropTypes.object.isRequired,
  hotkeyDefinitions: PropTypes.object.isRequired,
  languageOptions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.any.isRequired,
    })
  ),
  onCancel: PropTypes.func,
  onSubmit: PropTypes.func,
  onReset: PropTypes.func,
};

UserPreferences.defaultProps = {
  languageOptions: [
    { value: 'ONE', label: 'ONE' },
    { value: 'TWO', label: 'TWO' },
  ],
  onCancel: noop,
  onSubmit: noop,
  onReset: noop,
  disabled: true
};

export default UserPreferences;
