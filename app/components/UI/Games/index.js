import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  FlatList,
  Dimensions,
  InteractionManager,
  TouchableOpacity,
} from 'react-native';
import {
  getNetworkTypeById,
  findBlockExplorerForRpc,
  getBlockExplorerName,
} from '../../../util/networks';
import {
  getEtherscanAddressUrl,
  getEtherscanBaseUrl,
} from '../../../util/etherscan';
import { fontStyles, baseStyles } from '../../../styles/common';
import { strings } from '../../../../locales/i18n';
import Engine from '../../../core/Engine';
import { showAlert } from '../../../actions/alert';
import { CANCEL_RATE, SPEED_UP_RATE } from '@metamask/controllers';
import { renderFromWei } from '../../../util/number';
import Device from '../../../util/device';
import { RPC, NO_RPC_BLOCK_EXPLORER } from '../../../constants/network';
import TransactionActionModal from '../TransactionActionModal';
import Logger from '../../../util/Logger';
import { validateTransactionActionBalance } from '../../../util/transactions';
import { SafeAreaView } from 'react-native-safe-area-context';
import Modal from 'react-native-modal';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import RetryModal from './RetryModal';
import UpdateEIP1559Tx from '../UpdateEIP1559Tx';
import { collectibleContractsSelector } from '../../../reducers/collectibles';
import { isQRHardwareAccount } from '../../../util/address';
import { ThemeContext, mockTheme } from '../../../util/theme';
import withQRHardwareAwareness from '../QRHardware/withQRHardwareAwareness';
import { requestGamesList } from "./fetch"
import WebsiteIcon from '../../UI/WebsiteIcon';


const createStyles = (colors) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: colors.background.default,
      flex: 1,
    },
    bottomModal: {
      justifyContent: 'flex-end',
      margin: 0,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background.default,
      minHeight: Dimensions.get('window').height / 2,
    },
    keyboardAwareWrapper: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    loader: {
      alignSelf: 'center',
    },
    text: {
      fontSize: 20,
      color: colors.text.muted,
      ...fontStyles.normal,
    },
    viewMoreBody: {
      marginBottom: 36,
      marginTop: 24,
    },
    viewOnEtherscan: {
      fontSize: 16,
      color: colors.primary.default,
      ...fontStyles.normal,
      textAlign: 'center',
    },
    websiteIcon: {
      width: 44,
      height: 44,
    },
    row: {
      flexDirection: 'row',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderBottomColor: colors.border.muted,
      borderBottomWidth: 1,
    },
    info: {
      marginLeft: 20,
      flex: 1,
    },
    name: {
      ...fontStyles.bold,
      fontSize: 16,
      marginBottom: 10,
      color: colors.text.default,
    },
    desc: {
      marginBottom: 10,
      ...fontStyles.normal,
      fontSize: 12,
      color: colors.text.alternative,
    },
    url: {
      marginBottom: 10,
      ...fontStyles.normal,
      fontSize: 12,
      color: colors.text.alternative,
    },
    emailText: {
      marginBottom: 10,
      ...fontStyles.normal,
      fontSize: 14,
      bold:true,
      color: colors.text.alternative,
    },
    email: {
      marginBottom: 10,
      ...fontStyles.normal,
      fontSize: 12,
      backgroundColor:"#F8F8F8",
      padding:5,
      color: colors.text.alternative,
    },
  });

const ROW_HEIGHT = (Device.isIos() ? 95 : 100) + StyleSheet.hairlineWidth;

/**
 * View that renders a list of transactions for a specific asset
 */
class Games extends PureComponent {
  static propTypes = {
    assetSymbol: PropTypes.string,
    /**
     * Map of accounts to information objects including balances
     */
    accounts: PropTypes.object,
    /**
     * Callback to close the view
     */
    close: PropTypes.func,
    /**
     * Object containing token exchange rates in the format address => exchangeRate
     */
    contractExchangeRates: PropTypes.object,
    /**
     * Frequent RPC list from PreferencesController
     */
    frequentRpcList: PropTypes.array,
    /**
    /* navigation object required to push new views
    */
    navigation: PropTypes.object,
    /**
     * Object representing the selected network
     */
    network: PropTypes.object,
    /**
     * An array that represents the user collectible contracts
     */
    collectibleContracts: PropTypes.array,
    /**
     * An array that represents the user tokens
     */
    tokens: PropTypes.object,
    /**
     * An array of transactions objects
     */
    transactions: PropTypes.array,
    /**
     * An array of transactions objects that have been submitted
     */
    submittedTransactions: PropTypes.array,
    /**
     * An array of transactions objects that have been confirmed
     */
    confirmedTransactions: PropTypes.array,
    /**
     * A string that represents the selected address
     */
    selectedAddress: PropTypes.string,
    /**
     * ETH to current currency conversion rate
     */
    conversionRate: PropTypes.number,
    /**
     * Currency code of the currently-active currency
     */
    currentCurrency: PropTypes.string,
    /**
     * Loading flag from an external call
     */
    loading: PropTypes.bool,
    /**
     * Pass the flatlist ref to the parent
     */
    onRefSet: PropTypes.func,
    /**
     * Optional header component
     */
    header: PropTypes.object,
    /**
     * Optional header height
     */
    headerHeight: PropTypes.number,
    exchangeRate: PropTypes.number,
    /**
     * Indicates whether third party API mode is enabled
     */
    thirdPartyApiMode: PropTypes.bool,
    isSigningQRObject: PropTypes.bool,
  };

  static defaultProps = {
    headerHeight: 0,
  };

  state = {
    selectedTx: new Map(),
    ready: false,
    refreshing: false,
    cancelIsOpen: false,
    cancel1559IsOpen: false,
    cancelConfirmDisabled: false,
    speedUpIsOpen: false,
    speedUp1559IsOpen: false,
    retryIsOpen: false,
    speedUpConfirmDisabled: false,
    rpcBlockExplorer: undefined,
    errorMsg: undefined,
    isQRHardwareAccount: false,
    gamesData:{
      accounts:[],
      hasNext:false
    }
  };

  existingGas = null;
  existingTx = null;
  cancelTxId = null;
  speedUpTxId = null;
  selectedTx = null;

  flatList = React.createRef();

  componentDidMount = () => {
    this.mounted = true;
    setTimeout(() => {
      this.mounted && this.setState({ ready: true });
      this.init();
      this.props.onRefSet && this.props.onRefSet(this.flatList);
    }, 100);

    const {
      network: {
        provider: { rpcTarget, type },
      },
      frequentRpcList,
    } = this.props;
    let blockExplorer;
    if (type === RPC) {
      blockExplorer =
        findBlockExplorerForRpc(rpcTarget, frequentRpcList) ||
        NO_RPC_BLOCK_EXPLORER;
    }
    this.setState({ rpcBlockExplorer: blockExplorer });
    this.setState({
      isQRHardwareAccount: isQRHardwareAccount(this.props.selectedAddress),
    });

    const result = requestGamesList()
    this.setState({
      gamesData:result
    })
    
  };

  componentWillUnmount() {
    this.mounted = false;
  }

  init() {
    this.mounted && this.setState({ ready: true });

  }

  scrollToIndex = (index) => {
    if (!this.scrolling && (this.props.headerHeight || index)) {
      this.scrolling = true;
      // eslint-disable-next-line no-unused-expressions
      this.flatList?.current?.scrollToIndex({ index, animated: true });
      setTimeout(() => {
        this.scrolling = false;
      }, 300);
    }
  };

  toggleDetailsView = (id, index) => {
    // const oldId = this.selectedTx && this.selectedTx.id;
    // const oldIndex = this.selectedTx && this.selectedTx.index;

    // if (this.selectedTx && oldId !== id && oldIndex !== index) {
    //   this.selectedTx = null;
    //   this.toggleDetailsView(oldId, oldIndex);
    //   InteractionManager.runAfterInteractions(() => {
    //     this.toggleDetailsView(id, index);
    //   });
    // } else {
    //   this.setState((state) => {
    //     const selectedTx = new Map(state.selectedTx);
    //     const show = !selectedTx.get(id);
    //     selectedTx.set(id, show);
    //     if (show && (this.props.headerHeight || index)) {
    //       InteractionManager.runAfterInteractions(() => {
    //         this.scrollToIndex(index);
    //       });
    //     }
    //     this.selectedTx = show ? { id, index } : null;
    //     return { selectedTx };
    //   })
    // }

  };

  onRefresh = async () => {
    this.setState({ refreshing: true });
    Logger.log("请求结果:"+JSON.stringify(this.props))
    // const result = await requestGamesList({
    //   addresses:[this.props.addresses]
    // })
    // Logger.log("返回结果:"+JSON.stringify(result))
    // this.props.thirdPartyApiMode && (await Engine.refreshTransactionHistory());
    this.setState({ refreshing: false });
  };

  renderLoader = () => {
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator style={styles.loader} size="small" />
      </View>
    );
  };

  renderEmpty = () => {
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <ScrollView
        contentContainerStyle={styles.emptyContainer}
        refreshControl={
          <RefreshControl
            colors={[colors.primary.default]}
            tintColor={colors.icon.default}
            refreshing={this.state.refreshing}
            onRefresh={this.onRefresh}
          />
        }
      >
        {this.props.header ? this.props.header : null}
        <View style={styles.emptyContainer}>
          <Text style={styles.text}>{strings('wallet.no_transactions')}</Text>
        </View>
      </ScrollView>
    );
  };

  viewOnBlockExplore = () => {
    const {
      navigation,
      network: {
        network,
        provider: { type },
      },
      selectedAddress,
      close,
    } = this.props;
    const { rpcBlockExplorer } = this.state;
    try {
      let url;
      let title;
      if (type === RPC) {
        url = `${rpcBlockExplorer}/address/${selectedAddress}`;
        title = new URL(rpcBlockExplorer).hostname;
      } else {
        const networkResult = getNetworkTypeById(network);
        url = getEtherscanAddressUrl(networkResult, selectedAddress);
        title = getEtherscanBaseUrl(networkResult).replace('https://', '');
      }
      navigation.push('Webview', {
        screen: 'SimpleWebview',
        params: {
          url,
          title,
        },
      });
      close && close();
    } catch (e) {
      Logger.error(e, {
        message: `can't get a block explorer link for network `,
        network,
      });
    }
  };

  renderViewMore = () => {
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <View style={styles.viewMoreBody}>
        <TouchableOpacity
          onPress={this.viewOnBlockExplore}
          style={styles.touchableViewOnEtherscan}
        >
          <Text reset style={styles.viewOnEtherscan}>
            {(this.state.rpcBlockExplorer &&
              `${strings(
                'transactions.view_full_history_on',
              )} ${getBlockExplorerName(this.state.rpcBlockExplorer)}`) ||
              strings('transactions.view_full_history_on_etherscan')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  getItemLayout = (data, index) => ({
    length: ROW_HEIGHT,
    offset: this.props.headerHeight + ROW_HEIGHT * index,
    index,
  });

  keyExtractor = (item) => item.id.toString();

  onSpeedUpAction = (speedUpAction, existingGas, tx) => {
    this.existingGas = existingGas;
    this.speedUpTxId = tx.id;
    this.existingTx = tx;
    if (existingGas.isEIP1559Transaction) {
      this.setState({ speedUp1559IsOpen: speedUpAction });
    } else {
      const speedUpConfirmDisabled = validateTransactionActionBalance(
        tx,
        SPEED_UP_RATE,
        this.props.accounts,
      );
      this.setState({ speedUpIsOpen: speedUpAction, speedUpConfirmDisabled });
    }
  };

  onSpeedUpCompleted = () => {
    this.setState({ speedUp1559IsOpen: false, speedUpIsOpen: false });
    this.existingGas = null;
    this.speedUpTxId = null;
    this.existingTx = null;
  };

  onCancelAction = (cancelAction, existingGas, tx) => {
    this.existingGas = existingGas;
    this.cancelTxId = tx.id;
    this.existingTx = tx;

    if (existingGas.isEIP1559Transaction) {
      this.setState({ cancel1559IsOpen: cancelAction });
    } else {
      const cancelConfirmDisabled = validateTransactionActionBalance(
        tx,
        CANCEL_RATE,
        this.props.accounts,
      );
      this.setState({ cancelIsOpen: cancelAction, cancelConfirmDisabled });
    }
  };

  onCancelCompleted = () => {
    this.setState({ cancel1559IsOpen: false, cancelIsOpen: false });
    this.existingGas = null;
    this.cancelTxId = null;
    this.existingTx = null;
  };

  handleSpeedUpTransactionFailure = (e) => {
    const speedUpTxId = this.speedUpTxId;
    Logger.error(e, { message: `speedUpTransaction failed `, speedUpTxId });
    InteractionManager.runAfterInteractions(this.toggleRetry(e));
    this.setState({
      errorMsg: e.message,
      speedUp1559IsOpen: false,
      speedUpIsOpen: false,
    });
  };

  handleCancelTransactionFailure = (e) => {
    const cancelTxId = this.cancelTxId;
    Logger.error(e, { message: `cancelTransaction failed `, cancelTxId });
    InteractionManager.runAfterInteractions(this.toggleRetry(e));
    this.setState({
      errorMsg: e.message,
      cancel1559IsOpen: false,
      cancelIsOpen: false,
    });
  };

  speedUpTransaction = async (EIP1559TransactionData) => {
    try {
      if (EIP1559TransactionData) {
        await Engine.context.TransactionController.speedUpTransaction(
          this.speedUpTxId,
          {
            maxFeePerGas: `0x${EIP1559TransactionData?.suggestedMaxFeePerGasHex}`,
            maxPriorityFeePerGas: `0x${EIP1559TransactionData?.suggestedMaxPriorityFeePerGasHex}`,
          },
        );
      } else {
        await Engine.context.TransactionController.speedUpTransaction(
          this.speedUpTxId,
        );
      }
      this.onSpeedUpCompleted();
    } catch (e) {
      this.handleSpeedUpTransactionFailure(e);
    }
  };

  signQRTransaction = async (tx) => {
    const { KeyringController, TransactionController } = Engine.context;
    await KeyringController.resetQRKeyringState();
    await TransactionController.approveTransaction(tx.id);
  };

  cancelUnsignedQRTransaction = async (tx) => {
    await Engine.context.TransactionController.cancelTransaction(tx.id);
  };

  cancelTransaction = async (EIP1559TransactionData) => {
    try {
      if (EIP1559TransactionData) {
        await Engine.context.TransactionController.stopTransaction(
          this.cancelTxId,
          {
            maxFeePerGas: `0x${EIP1559TransactionData?.suggestedMaxFeePerGasHex}`,
            maxPriorityFeePerGas: `0x${EIP1559TransactionData?.suggestedMaxPriorityFeePerGasHex}`,
          },
        );
      } else {
        await Engine.context.TransactionController.stopTransaction(
          this.cancelTxId,
        );
      }
      this.onCancelCompleted();
    } catch (e) {
      this.handleCancelTransactionFailure(e);
    }
  };

  renderItem = ({ item, index }) => {
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);
    return    <TouchableOpacity
    // eslint-disable-next-line react/jsx-no-bind
    onPress={() => {
      this.props.navigation.navigate("Games",{
        screen:"GameDetailScreen",
        params:{
          title:item.id+"@" + item.world.name
        }
      })
    }}
    style={styles.row}
  >
    <WebsiteIcon url={item.world.icon} style={styles.websiteIcon} />
    <View style={styles.info}>
      <Text style={styles.name}>{item.world.name}</Text>
      <Text style={styles.emailText}>{strings('games.account_id_title')}</Text>
      <Text style={styles.url}>{item.id +"@" + item.world.name}</Text>
      <Text style={styles.url}>{item.worldAddress}</Text>
      <Text style={styles.emailText}>{strings('games.register_email')}</Text>
      <Text style={styles.email}>{item.email}</Text>
      {this.renderDesc(item)}
    </View>
  </TouchableOpacity>

  };

  renderDesc = (meta) => {
    const { desc } = meta;
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    if (desc) {
      return <Text style={styles.desc}>{desc}</Text>;
    }
    return null;
  };

  toggleRetry = (errorMsg) => {
    this.setState((state) => ({ retryIsOpen: !state.retryIsOpen, errorMsg }));
  };

  retry = () => {
    this.setState((state) => ({
      retryIsOpen: !state.retryIsOpen,
      errorMsg: undefined,
    }));

    //If the exitsing TX id true then it is a speed up retry
    if (this.speedUpTxId) {
      InteractionManager.runAfterInteractions(() => {
        this.onSpeedUpAction(true, this.existingGas, this.existingTx);
      });
    }
    if (this.cancelTxId) {
      InteractionManager.runAfterInteractions(() => {
        this.onCancelAction(true, this.existingGas, this.existingTx);
      });
    }
  };

  renderUpdateTxEIP1559Gas = (isCancel) => {
    const { isSigningQRObject } = this.props;
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    if (!this.existingGas) return null;
    if (this.existingGas.isEIP1559Transaction && !isSigningQRObject) {
      return (
        <Modal
          isVisible
          animationIn="slideInUp"
          animationOut="slideOutDown"
          style={styles.bottomModal}
          backdropColor={colors.overlay.default}
          backdropOpacity={1}
          animationInTiming={600}
          animationOutTiming={600}
          onBackdropPress={
            isCancel ? this.onCancelCompleted : this.onSpeedUpCompleted
          }
          onBackButtonPress={
            isCancel ? this.onCancelCompleted : this.onSpeedUpCompleted
          }
          onSwipeComplete={
            isCancel ? this.onCancelCompleted : this.onSpeedUpCompleted
          }
          swipeDirection={'down'}
          propagateSwipe
        >
          <KeyboardAwareScrollView
            contentContainerStyle={styles.keyboardAwareWrapper}
          >
            <UpdateEIP1559Tx
              gas={this.existingTx.transaction.gas}
              onSave={
                isCancel ? this.cancelTransaction : this.speedUpTransaction
              }
              onCancel={
                isCancel ? this.onCancelCompleted : this.onSpeedUpCompleted
              }
              existingGas={this.existingGas}
              isCancel={isCancel}
            />
          </KeyboardAwareScrollView>
        </Modal>
      );
    }
  };

  renderList = () => {
    const {
      submittedTransactions,
      confirmedTransactions,
      header,
      isSigningQRObject,
    } = this.props;
    const { cancelConfirmDisabled, speedUpConfirmDisabled , gamesData } = this.state;
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    const transactions =
      submittedTransactions && submittedTransactions.length
        ? submittedTransactions.concat(confirmedTransactions)
        : this.props.transactions;

    const renderSpeedUpGas = () => {
      if (!this.existingGas) return null;
      if (!this.existingGas.isEIP1559Transaction)
        return `${renderFromWei(
          Math.floor(this.existingGas.gasPrice * SPEED_UP_RATE),
        )} ${strings('unit.eth')}`;
    };

    const renderCancelGas = () => {
      if (!this.existingGas) return null;
      if (!this.existingGas.isEIP1559Transaction)
        return `${renderFromWei(
          Math.floor(this.existingGas.gasPrice * CANCEL_RATE),
        )} ${strings('unit.eth')}`;
    };

    return (
      <View style={styles.wrapper} testID={'transactions-screen'}>
        <FlatList
          ref={this.flatList}
          getItemLayout={this.getItemLayout}
          data={gamesData.accounts}
          extraData={this.state}
          keyExtractor={this.keyExtractor}
          refreshControl={
            <RefreshControl
              colors={[colors.primary.default]}
              tintColor={colors.icon.default}
              refreshing={this.state.refreshing}
              onRefresh={this.onRefresh}
            />
          }
          renderItem={this.renderItem}
          initialNumToRender={10}
          maxToRenderPerBatch={2}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={header}
          ListFooterComponent={this.renderViewMore}
          style={baseStyles.flexGrow}
          scrollIndicatorInsets={{ right: 1 }}
        />

        {!isSigningQRObject && this.state.cancelIsOpen && (
          <TransactionActionModal
            isVisible={this.state.cancelIsOpen}
            confirmDisabled={cancelConfirmDisabled}
            onCancelPress={this.onCancelCompleted}
            onConfirmPress={this.cancelTransaction}
            confirmText={strings('transaction.lets_try')}
            confirmButtonMode={'confirm'}
            cancelText={strings('transaction.nevermind')}
            feeText={renderCancelGas()}
            titleText={strings('transaction.cancel_tx_title')}
            gasTitleText={strings('transaction.gas_cancel_fee')}
            descriptionText={strings('transaction.cancel_tx_message')}
          />
        )}
        {!isSigningQRObject && this.state.speedUpIsOpen && (
          <TransactionActionModal
            isVisible={this.state.speedUpIsOpen && !isSigningQRObject}
            confirmDisabled={speedUpConfirmDisabled}
            onCancelPress={this.onSpeedUpCompleted}
            onConfirmPress={this.speedUpTransaction}
            confirmText={strings('transaction.lets_try')}
            confirmButtonMode={'confirm'}
            cancelText={strings('transaction.nevermind')}
            feeText={renderSpeedUpGas()}
            titleText={strings('transaction.speedup_tx_title')}
            gasTitleText={strings('transaction.gas_speedup_fee')}
            descriptionText={strings('transaction.speedup_tx_message')}
          />
        )}

        <RetryModal
          onCancelPress={this.toggleRetry}
          onConfirmPress={this.retry}
          retryIsOpen={this.state.retryIsOpen}
        />
      </View>
    );
  };

  render = () => {
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <SafeAreaView
        edges={['bottom']}
        style={styles.wrapper}
        testID={'txn-screen'}
      >
        {!this.state.ready || this.props.loading
          ? this.renderLoader()
          : !this.props.transactions.length
          ? this.renderEmpty()
          : this.renderList()}
        {(this.state.speedUp1559IsOpen || this.state.cancel1559IsOpen) &&
          this.renderUpdateTxEIP1559Gas(this.state.cancel1559IsOpen)}
      </SafeAreaView>
    );
  };
}

const mapStateToProps = (state) => ({
  accounts: state.engine.backgroundState.AccountTrackerController.accounts,
  chainId: state.engine.backgroundState.NetworkController.provider.chainId,
  collectibleContracts: collectibleContractsSelector(state),
  contractExchangeRates:
    state.engine.backgroundState.TokenRatesController.contractExchangeRates,
  conversionRate:
    state.engine.backgroundState.CurrencyRateController.conversionRate,
  currentCurrency:
    state.engine.backgroundState.CurrencyRateController.currentCurrency,
  selectedAddress:
    state.engine.backgroundState.PreferencesController.selectedAddress,
  thirdPartyApiMode: state.privacy.thirdPartyApiMode,
  frequentRpcList:
    state.engine.backgroundState.PreferencesController.frequentRpcList,
  network: state.engine.backgroundState.NetworkController,
  gasFeeEstimates:
    state.engine.backgroundState.GasFeeController.gasFeeEstimates,
  primaryCurrency: state.settings.primaryCurrency,
  tokens: state.engine.backgroundState.TokensController.tokens.reduce(
    (tokens, token) => {
      tokens[token.address] = token;
      return tokens;
    },
    {},
  ),
  nativeCurrency:
    state.engine.backgroundState.CurrencyRateController.nativeCurrency,
  gasEstimateType:
    state.engine.backgroundState.GasFeeController.gasEstimateType,
  networkType: state.engine.backgroundState.NetworkController.provider.type,
});

Games.contextType = ThemeContext;

const mapDispatchToProps = (dispatch) => ({
  showAlert: (config) => dispatch(showAlert(config)),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withQRHardwareAwareness(Games));
