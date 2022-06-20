import React, { PureComponent } from 'react';
import {
  ActivityIndicator,
  Text,
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import PropTypes, { string } from 'prop-types';
import { connect } from 'react-redux';
import { util } from '@metamask/controllers';
import { getNetworkNavbarOptions } from '../../../UI/Navbar';
import Engine from '../../../../core/Engine';
import { ThemeContext, mockTheme } from '../../../../util/theme';
import AccountGamesList from '../../../UI/AccountGamesList';
import GamesDetailHeader from '../../../UI/Games/GamesDetailHeader';
import GamesDetailTrustAdminView from '../../../UI/Games/GamesDetailTrustAdminView';
import { strings } from '../../../../../locales/i18n';
import { getGamesDetail } from '../../../UI/Games/fetch';

import { renderFromWei } from '../../../../util/number';
import { doENSLookup, doENSReverseLookup } from '../../../../util/ENSUtils';
import { getTicker, getEther } from '../../../../util/transactions';
import {
  setSelectedAsset,
  setRecipient,
  newAssetTransaction,
} from '../../../../actions/transaction';

const { hexToBN } = util;

const createStyles = (colors) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: colors.background.default,
      flex: 1,
    },
    assetOverviewWrapper: {
      height: 280,
    },
    loader: {
      backgroundColor: colors.background.default,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

/**
 * View that displays a specific asset (Token or ETH)
 * including the overview (Amount, Balance, Symbol, Logo)
 * and also the transaction list
 */
class GamesDetailScreen extends PureComponent {
  static propTypes = {
    accounts: PropTypes.object,
    /**
    /* navigation object required to access the props
    /* passed by the parent component
    */
    navigation: PropTypes.object,
    /**
    /* conversion rate of ETH - FIAT
    */
    conversionRate: PropTypes.any,
    /**
    /* Selected currency
    */
    currentCurrency: PropTypes.string,
    /**
    /* Identities object required to get account name
    */
    identities: PropTypes.object,
    /**
     * A string that represents the selected address
     */
    selectedAddress: PropTypes.string,
    /**
     * List of keyrings
     */
    keyrings: PropTypes.array,
    /**
     * Current provider ticker
     */
    ticker: PropTypes.string,
    /**
     * A string representing the network name
     */
    chainId: PropTypes.string,
    /**
     * An array that represents the user transactions
     */
    transactions: PropTypes.array,
    /**
     * Array of ERC20 assets
     */
    tokens: PropTypes.array,
    /**
     * Indicates whether third party API mode is enabled
     */
    thirdPartyApiMode: PropTypes.bool,
    swapsTransactions: PropTypes.object,
    /**
     * Object that represents the current route info like params passed to it
     */
    route: PropTypes.object,
    /**
     * Set selected in transaction state
     */
    setSelectedAsset: PropTypes.func,
  };

  state = {
    balanceIsZero: false,
    refreshing: false,
    loading: false,
    fromSelectedAddress: this.props.selectedAddress,
    detailData: this.props.route.params?.data ?? {},
    fromAccountName: this.props.identities[this.props.selectedAddress].name,
    fromAccountBalance: undefined,
  };

  updateNavBar = () => {
    const { navigation, route } = this.props;
    const colors = this.context.colors || mockTheme.colors;
    navigation.setOptions(
      getNetworkNavbarOptions(
        route.params?.title ?? '',
        false,
        navigation,
        colors,
        true,
      ),
    );
  };

  componentDidMount = async () => {
    setTimeout(() => {
      this.getDetail();
    }, 100);
    this.updateNavBar();

  }

  getDetail = async () => {

    const { detailData } = this.state;
    console.log("详情数据1" + JSON.stringify(detailData))
    if (detailData.id == null) {
      return;
    }
    this.setState({
      loading: true,
    });
    try {
      const detail = await getGamesDetail(detailData.world, detailData.metaverseAddress, detailData.metaverseUrl);
      console.log("详情数据" + JSON.stringify(detail))
      this.setState({
        detailData: {
          ...detailData,
          ...detail,
        },
        loading: false,
      });
    } catch (error) {
      this.setState({
        loading: false,
      });
    }
  };

  componentDidUpdate(prevProps) {
    this.updateNavBar();
  }

  showLoaderAndNormalize() {
    this.setState({ loading: true }, () => {
      this.normalizeTransactions();
    });
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  renderLoader = () => {
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <View style={styles.loader}>
        <ActivityIndicator style={styles.loader} size="small" />
      </View>
    );
  };

  onAccountChange = async (accountAddress) => {
    this.setState({
      fromSelectedAddress: accountAddress
    })
    const { identities, ticker, accounts } = this.props;
    const { name } = identities[accountAddress];
    const { PreferencesController } = Engine.context;
    const fromAccountBalance = `${renderFromWei(
      accounts[accountAddress].balance,
    )} ${getTicker(ticker)}`;
    const ens = await doENSReverseLookup(accountAddress);
    const fromAccountName = ens || name;
    PreferencesController.setSelectedAddress(accountAddress);
    // If new account doesn't have the asset
    this.props.setSelectedAsset(getEther(ticker));
    this.setState({
      fromAccountName,
      fromAccountBalance,
      fromSelectedAddress: accountAddress,
      balanceIsZero: hexToBN(accounts[accountAddress].balance).isZero(),
    });
  };

  render = () => {
    const { loading, detailData, fromSelectedAddress } = this.state;
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    const { identities, keyrings, ticker } = this.props;


    return (
      <View style={styles.wrapper}>
        {loading ? (
          this.renderLoader()
        ) : (
          <ScrollView>
            <View>
              <GamesDetailHeader
                website={detailData.url}
                headerIcon={detailData.icon}
                desc={detailData.description}
                context={this.context}
              />

              <View style={{ marginTop: 20 }} />
              <AccountGamesList
                enableAccountsAddition={false}
                identities={identities}
                website={detailData.url}
                metaverseUrl={detailData.metaverseUrl}
                metaverseAddress={detailData.metaverseAddress}
                openBrower={url => {
                  this.props.navigation.navigate('BrowserHome', {
                    screen: "BrowserView",
                    params: {
                      newTabUrl: url,
                      timestamp: Date.now(),
                    }
                  });
                }}
                selectedAddress={fromSelectedAddress}
                keyrings={keyrings}
                onAccountChange={this.onAccountChange}
                ticker={ticker}
              />
            </View>
          </ScrollView>
        )}
      </View>
    );
  };
}

GamesDetailScreen.contextType = ThemeContext;

const mapStateToProps = (state) => ({
  accounts: state.engine.backgroundState.AccountTrackerController.accounts,
  swapsTransactions:
    state.engine.backgroundState.TransactionController.swapsTransactions || {},
  conversionRate:
    state.engine.backgroundState.CurrencyRateController.conversionRate,
  currentCurrency:
    state.engine.backgroundState.CurrencyRateController.currentCurrency,
  selectedAddress:
    state.engine.backgroundState.PreferencesController.selectedAddress,
  identities: state.engine.backgroundState.PreferencesController.identities,
  chainId: state.engine.backgroundState.NetworkController.provider.chainId,
  tokens: state.engine.backgroundState.TokensController.tokens,
  transactions: state.engine.backgroundState.TransactionController.transactions,
  thirdPartyApiMode: state.privacy.thirdPartyApiMode,
});

const mapDispatchToProps = (dispatch) => ({
  setSelectedAsset: (selectedAsset) =>
    dispatch(setSelectedAsset(selectedAsset)),
});

export default connect(mapStateToProps, mapDispatchToProps)(GamesDetailScreen);
