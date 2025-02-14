import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Engine from '../../../core/Engine';
import AnimatedQRScannerModal from '../../UI/QRHardware/AnimatedQRScanner';
import SelectQRAccounts from './SelectQRAccounts';
import ConnectQRInstruction from './Instruction';
import Icon from 'react-native-vector-icons/FontAwesome';
import BlockingActionModal from '../../UI/BlockingActionModal';
import { strings } from '../../../../locales/i18n';
import { IAccount } from './types';
import { UR } from '@ngraveio/bc-ur';
import Alert, { AlertType } from '../../Base/Alert';
import AnalyticsV2 from '../../../util/analyticsV2';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import Device from '../../../util/device';
import { mockTheme, useAppThemeFromContext } from '../../../util/theme';
import { SUPPORTED_UR_TYPE } from '../../../constants/qr';
import { fontStyles } from '../../../styles/common';
import Logger from '../../../util/Logger';

interface IConnectQRHardwareProps {
  navigation: any;
}
const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
    },
    navbarRightButton: {
      alignSelf: 'flex-end',
      paddingTop: 20,
      paddingBottom: 10,
      marginTop: Device.isIphoneX() ? 40 : 20,
    },
    closeIcon: {
      fontSize: 28,
      color: colors.text.default,
    },
    header: {
      width: '100%',
      paddingHorizontal: 32,
      flexDirection: 'column',
      alignItems: 'center',
    },
    close: {
      alignSelf: 'flex-end',
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    qrcode: {
      alignSelf: 'flex-start',
    },
    error: {
      ...fontStyles.normal,
      fontSize: 14,
      color: colors.red,
    },
    text: {
      color: colors.text.default,
      fontSize: 14,
      ...fontStyles.normal,
    },
  });

const ConnectQRHardware = ({ navigation }: IConnectQRHardwareProps) => {
  const { colors } = useAppThemeFromContext() || mockTheme;
  const styles = createStyles(colors);

  const KeyringController = useMemo(() => {
    const { KeyringController: keyring } = Engine.context as any;
    return keyring;
  }, []);

  const AccountTrackerController = useMemo(
    () => (Engine.context as any).AccountTrackerController,
    [],
  );

  const [QRState, setQRState] = useState({
    sync: {
      reading: false,
    },
  });
  const [scannerVisible, setScannerVisible] = useState(false);
  const [blockingModalVisible, setBlockingModalVisible] = useState(false);
  const [accounts, setAccounts] = useState<
    { address: string; index: number; balance: string }[]
  >([]);
  const [trackedAccounts, setTrackedAccounts] = useState<{
    [p: string]: { balance: string };
  }>({});
  const [checkedAccounts, setCheckedAccounts] = useState<number[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const resetError = useCallback(() => {
    setErrorMsg('');
  }, []);

  const [existingAccounts, setExistingAccounts] = useState<string[]>([]);

  const showScanner = useCallback(() => {
    setScannerVisible(true);
  }, []);

  const hideScanner = useCallback(() => {
    setScannerVisible(false);
  }, []);

  useEffect(() => {
    KeyringController.getAccounts().then((value: string[]) => {
      setExistingAccounts(value);
    });
  }, [KeyringController]);

  const subscribeKeyringState = useCallback((storeValue: any) => {
    setQRState(storeValue);
  }, []);

  useEffect(() => {
    let memStore: any;
    KeyringController.getQRKeyringState().then((_memStore: any) => {
      memStore = _memStore;
      memStore.subscribe(subscribeKeyringState);
    });
    return () => {
      if (memStore) {
        memStore.unsubscribe(subscribeKeyringState);
      }
    };
  }, [KeyringController, subscribeKeyringState]);

  useEffect(() => {
    const unTrackedAccounts: string[] = [];
    accounts.forEach((account) => {
      if (!trackedAccounts[account.address]) {
        unTrackedAccounts.push(account.address);
      }
    });
    if (unTrackedAccounts.length > 0) {
      AccountTrackerController.syncBalanceWithAddresses(unTrackedAccounts).then(
        (_trackedAccounts: any) => {
          setTrackedAccounts(
            Object.assign({}, trackedAccounts, _trackedAccounts),
          );
        },
      );
    }
  }, [AccountTrackerController, accounts, trackedAccounts]);

  useEffect(() => {
    if (QRState.sync.reading) {
      showScanner();
    } else {
      hideScanner();
    }
  }, [QRState.sync, hideScanner, showScanner]);

  const onConnectHardware = useCallback(async () => {
    AnalyticsV2.trackEvent(
      AnalyticsV2.ANALYTICS_EVENTS.CONTINUE_QR_HARDWARE_WALLET,
      {
        device_type: 'QR Hardware',
      },
    );
    resetError();
    const _accounts = await KeyringController.connectQRHardware(0);
    setAccounts(_accounts);
  }, [KeyringController, resetError]);

  const onScanSuccess = useCallback(
    (ur: UR) => {
      hideScanner();
      AnalyticsV2.trackEvent(
        AnalyticsV2.ANALYTICS_EVENTS.CONNECT_HARDWARE_WALLET_SUCCESS,
        {
          device_type: 'QR Hardware',
        },
      );
      if (ur.type === SUPPORTED_UR_TYPE.CRYPTO_HDKEY) {
        KeyringController.submitQRCryptoHDKey(ur.cbor.toString('hex'));
      } else {
        KeyringController.submitQRCryptoAccount(ur.cbor.toString('hex'));
      }
      resetError();
    },
    [KeyringController, hideScanner, resetError],
  );

  const onScanError = useCallback(
    (error: string) => {
      hideScanner();
      setErrorMsg(error);
    },
    [hideScanner],
  );

  const nextPage = useCallback(async () => {
    resetError();
    const _accounts = await KeyringController.connectQRHardware(1);
    setAccounts(_accounts);
  }, [KeyringController, resetError]);

  const prevPage = useCallback(async () => {
    resetError();
    const _accounts = await KeyringController.connectQRHardware(-1);
    setAccounts(_accounts);
  }, [KeyringController, resetError]);

  const onToggle = useCallback(
    (index: number) => {
      resetError();
      if (!checkedAccounts.includes(index)) {
        setCheckedAccounts([...checkedAccounts, index]);
      } else {
        setCheckedAccounts(checkedAccounts.filter((i) => i !== index));
      }
    },
    [checkedAccounts, resetError],
  );

  const enhancedAccounts: IAccount[] = useMemo(
    () =>
      accounts.map((account) => {
        let checked = false;
        let exist = false;
        if (checkedAccounts.includes(account.index)) checked = true;
        if (
          existingAccounts.find(
            (item) => item.toLowerCase() === account.address.toLowerCase(),
          )
        ) {
          exist = true;
          checked = true;
        }
        return {
          ...account,
          checked,
          exist,
          balance: trackedAccounts[account.address]?.balance || '0x0',
        };
      }),
    [accounts, checkedAccounts, existingAccounts, trackedAccounts],
  );

  const onUnlock = useCallback(async () => {
    resetError();
    setBlockingModalVisible(true);
    try {
      for (const account of checkedAccounts) {
        await KeyringController.unlockQRHardwareWalletAccount(account);
      }
    } catch (err) {
      Logger.log('Error: Connecting QR hardware wallet', err);
    }
    setBlockingModalVisible(false);
    navigation.goBack();
  }, [KeyringController, checkedAccounts, navigation, resetError]);

  const onForget = useCallback(async () => {
    resetError();
    await KeyringController.forgetQRDevice();
    navigation.goBack();
  }, [KeyringController, navigation, resetError]);

  const renderAlert = () =>
    errorMsg !== '' && (
      <Alert type={AlertType.Error} onPress={resetError}>
        <Text style={styles.error}>{errorMsg}</Text>
      </Alert>
    );

  return (
    <Fragment>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={navigation.goBack}
            style={styles.navbarRightButton}
          >
            <MaterialIcon name="close" size={15} style={styles.closeIcon} />
          </TouchableOpacity>
          <Icon
            name="qrcode"
            size={42}
            style={styles.qrcode}
            color={colors.text.default}
          />
        </View>
        {accounts.length <= 0 ? (
          <ConnectQRInstruction
            onConnect={onConnectHardware}
            renderAlert={renderAlert}
            navigation={navigation}
          />
        ) : (
          <SelectQRAccounts
            canUnlock={checkedAccounts.length > 0}
            accounts={enhancedAccounts}
            nextPage={nextPage}
            prevPage={prevPage}
            toggleAccount={onToggle}
            onUnlock={onUnlock}
            onForget={onForget}
          />
        )}
      </View>
      <AnimatedQRScannerModal
        visible={scannerVisible}
        purpose={'sync'}
        onScanSuccess={onScanSuccess}
        onScanError={onScanError}
        hideModal={hideScanner}
      />
      <BlockingActionModal modalVisible={blockingModalVisible} isLoadingAction>
        <Text style={styles.text}>
          {strings('connect_qr_hardware.please_wait')}
        </Text>
      </BlockingActionModal>
    </Fragment>
  );
};

export default ConnectQRHardware;
