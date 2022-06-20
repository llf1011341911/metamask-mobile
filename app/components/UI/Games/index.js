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
import { ThemeContext, mockTheme } from '../../../util/theme';
import withQRHardwareAwareness from '../QRHardware/withQRHardwareAwareness';
import { getWorldsInfo } from './fetch';
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
      bold: true,
      color: colors.text.alternative,
    },
    email: {
      marginBottom: 10,
      ...fontStyles.normal,
      fontSize: 12,
      backgroundColor: '#F8F8F8',
      padding: 5,
      color: colors.text.alternative,
    },
  });

const ROW_HEIGHT = (Device.isIos() ? 95 : 100) + StyleSheet.hairlineWidth;

/**
 * View that renders a list of transactions for a specific asset
 */
class Games extends PureComponent {
  static propTypes = {
    /**
    /* navigation object required to push new views
    */
    navigation: PropTypes.object,
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
     * Object representing the selected network
     */
    network: PropTypes.object,

    metaverseAddress:PropTypes.string,

    metaverseUrl:PropTypes.string
  };

  static defaultProps = {
    headerHeight: 0,
  };

  state = {
    loading: true,
    refreshing: false,
    retryIsOpen: false,
    errorMsg: undefined,
    accounts: [],
  };

  flatList = React.createRef();

  componentDidMount = () => {
    setTimeout(() => {
      this.onLoading()
    }, 100);
  };

  componentWillUnmount() { }

  onLoading = async () => {
    this.setState({
      loading: true
    });
    try {
      const { metaverseAddress , metaverseUrl } = this.props
      const result = await getWorldsInfo(metaverseAddress,metaverseUrl)
      this.setState({
        accounts: result,
        loading: false
      })
    } catch (error) {
      this.setState({
        accounts: [],
        loading: false
      })
    }
  };

  onRefresh = async () => {
    this.setState({ refreshing: true });
    try {
      const { metaverseAddress , metaverseUrl } = this.props
      const result = await getWorldsInfo(metaverseAddress,metaverseUrl)
      this.setState({
        accounts: result,
        refreshing: false
      })
    } catch (error) {
      this.setState({
        accounts: [],
        refreshing: false
      })
    }
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

  getItemLayout = (data, index) => ({
    length: ROW_HEIGHT,
    offset: this.props.headerHeight + ROW_HEIGHT * index,
    index,
  });

  keyExtractor = (item) => item.world.toString();

  renderItem = ({ item, index }) => {
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);
    return (
      <TouchableOpacity
        // eslint-disable-next-line react/jsx-no-bind
        onPress={() => {
          this.props.navigation.navigate('Games', {
            screen: 'GameDetailScreen',
            params: {
              title: item.name,
              data: {
                metaverseAddress:this.props.metaverseAddress,
                metaverseUrl:this.props.metaverseUrl,
                ...item
              }
            },
          });
        }}
        style={styles.row}
      >
        <WebsiteIcon url={item.icon} style={styles.websiteIcon} />
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.url}>{item.url}</Text>
          {this.renderDesc(item)}
        </View>
      </TouchableOpacity>
    );
  };

  renderDesc = (meta) => {
    const { description } = meta;
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    if (description) {
      return <Text style={styles.desc}>{description}</Text>;
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
  };

  renderList = () => {
    const { accounts } = this.state;
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <View style={styles.wrapper} testID={'transactions-screen'}>
        <FlatList
          ref={this.flatList}
          getItemLayout={this.getItemLayout}
          data={accounts}
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
          style={baseStyles.flexGrow}
          scrollIndicatorInsets={{ right: 1 }}
        />

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
    const { accounts, loading } = this.state;

    return (
      <SafeAreaView
        edges={['bottom']}
        style={styles.wrapper}
        testID={'txn-screen'}
      >
        {loading
          ? this.renderLoader()
          : !accounts.length
            ? this.renderEmpty()
            : this.renderList()}
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
