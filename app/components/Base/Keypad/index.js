import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import Keypad from './components';
import { KEYS } from './constants';
import useCurrency from './useCurrency';
function KeypadComponent({ onChange, value, currency }) {
  const { handler, decimalSeparator } = useCurrency(currency);
  const handleKeypadPress = useCallback(
    (pressedKey) => {
      const newValue = handler(value, pressedKey);
      onChange(newValue, pressedKey);
    },
    [handler, onChange, value],
  );
  const handleKeypadPress1 = useCallback(
    () => handleKeypadPress(KEYS.DIGIT_1),
    [handleKeypadPress],
  );
  const handleKeypadPress2 = useCallback(
    () => handleKeypadPress(KEYS.DIGIT_2),
    [handleKeypadPress],
  );
  const handleKeypadPress3 = useCallback(
    () => handleKeypadPress(KEYS.DIGIT_3),
    [handleKeypadPress],
  );
  const handleKeypadPress4 = useCallback(
    () => handleKeypadPress(KEYS.DIGIT_4),
    [handleKeypadPress],
  );
  const handleKeypadPress5 = useCallback(
    () => handleKeypadPress(KEYS.DIGIT_5),
    [handleKeypadPress],
  );
  const handleKeypadPress6 = useCallback(
    () => handleKeypadPress(KEYS.DIGIT_6),
    [handleKeypadPress],
  );
  const handleKeypadPress7 = useCallback(
    () => handleKeypadPress(KEYS.DIGIT_7),
    [handleKeypadPress],
  );
  const handleKeypadPress8 = useCallback(
    () => handleKeypadPress(KEYS.DIGIT_8),
    [handleKeypadPress],
  );
  const handleKeypadPress9 = useCallback(
    () => handleKeypadPress(KEYS.DIGIT_9),
    [handleKeypadPress],
  );
  const handleKeypadPress0 = useCallback(
    () => handleKeypadPress(KEYS.DIGIT_0),
    [handleKeypadPress],
  );
  const handleKeypadPressPeriod = useCallback(
    () => decimalSeparator && handleKeypadPress(KEYS.PERIOD),
    [decimalSeparator, handleKeypadPress],
  );
  const handleKeypadPressBack = useCallback(
    () => handleKeypadPress(KEYS.BACK),
    [handleKeypadPress],
  );
  const handleKeypadLongPressBack = useCallback(
    () => handleKeypadPress(KEYS.INITIAL),
    [handleKeypadPress],
  );

  return (
    <Keypad>
      <Keypad.Row>
        <Keypad.Button onPress={handleKeypadPress1}>1</Keypad.Button>
        <Keypad.Button onPress={handleKeypadPress2}>2</Keypad.Button>
        <Keypad.Button onPress={handleKeypadPress3}>3</Keypad.Button>
      </Keypad.Row>
      <Keypad.Row>
        <Keypad.Button onPress={handleKeypadPress4}>4</Keypad.Button>
        <Keypad.Button onPress={handleKeypadPress5}>5</Keypad.Button>
        <Keypad.Button onPress={handleKeypadPress6}>6</Keypad.Button>
      </Keypad.Row>
      <Keypad.Row>
        <Keypad.Button onPress={handleKeypadPress7}>7</Keypad.Button>
        <Keypad.Button onPress={handleKeypadPress8}>8</Keypad.Button>
        <Keypad.Button onPress={handleKeypadPress9}>9</Keypad.Button>
      </Keypad.Row>
      <Keypad.Row>
        <Keypad.Button onPress={handleKeypadPressPeriod}>
          {decimalSeparator}
        </Keypad.Button>
        <Keypad.Button onPress={handleKeypadPress0}>0</Keypad.Button>
        <Keypad.DeleteButton
          onPress={handleKeypadPressBack}
          onLongPress={handleKeypadLongPressBack}
          delayLongPress={500}
        />
      </Keypad.Row>
    </Keypad>
  );
}

KeypadComponent.propTypes = {
  /**
   * Function that will be called when a key is pressed with arguments `(value, key)`
   */
  onChange: PropTypes.func,
  /**
   * Currency code for the keypad rules and symbols. Defaults to native
   */
  currency: PropTypes.string,
  /**
   * Current value used to create new value when a key is pressed.
   */
  value: PropTypes.string,
};

export { KEYS };
export default KeypadComponent;
