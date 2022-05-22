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
import { getNetworkNavbarOptions } from '../../../UI/Navbar';
import Engine from '../../../../core/Engine';
import { ThemeContext, mockTheme } from '../../../../util/theme';
import GamesDetailAccountView from '../../../UI/Games/GamesDetailAccountView';
import GamesDetailHeader from '../../../UI/Games/GamesDetailHeader';
import GamesDetailTrustAdminView from "../../../UI/Games/GamesDetailTrustAdminView";
import { strings } from '../../../../../locales/i18n';

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
  };

  state = {
    refreshing: false,
    loading: false,
    detailData: {
      worldAddress: '0x59d590745a053e65a57ecda300caaef25b32a1e8',
      id: '1',
      address: '0x0ec94b0f7d593e0e3e3e4743324f208ec8d01ba3',
      trustAdmin: false,
      trustWorld: false,
      nonce: 0,
      level: 0,
      registeredAt: '2022-05-11T06:02:27.000Z',
      insertedAt: '2022-05-19T17:34:02.052Z',
      updatedAt: '2022-05-19T17:34:02.566Z',
      blockHash:
        '0xa93fd59c218c09b427dcbb75f428842a66b0f7e38e55ee8d0d6e6ea23b6733be',
      blockNumber: '130',
      transactionsCount: 0,
      tokenTransfersCount: 0,
      email: 'johndoe@github.com',
      pos: ['130', '0'],
      tokensCount: 0,
      world: {
        homepage: 'https://www.callofduty.com',
        desc: 'Call of Duty is a first-person shooter video game...',
        icon: 'LzlqLzRBQVFTa1pKUmdBQkFRQUFBUU...',
        name: '32a1E8',
      },
    },
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

  componentDidMount() {
    this.updateNavBar();
  }

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

  onRefresh = async () => {
    this.setState({ refreshing: true });
    this.props.thirdPartyApiMode && (await Engine.refreshTransactionHistory());
    this.setState({ refreshing: false });
  };

  render = () => {
    const { loading, detailData } = this.state;
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <View style={styles.wrapper}>
        {loading ? (
          this.renderLoader()
        ) : (
          <ScrollView>
            <View>
              <GamesDetailHeader
                website={detailData.world.homepage}
                headerIcon={detailData.world.icon}
                desc={detailData.world.desc}
                context={this.context}
              />
                
              <View style={{marginTop:20}}/>
              <GamesDetailAccountView
                accountId={detailData.id + '@' + detailData.world.name}
                email={detailData.email}
                address={detailData.address}
                context={this.context}
              />
              <GamesDetailTrustAdminView
                title={strings('games.trust_admin')}
                switchValue={true}
                tips={strings('games.trust_admin_tips')}
                context={this.context}
              />
              <GamesDetailTrustAdminView
                title={strings('games.trust_world')}
                switchValue={true}
                tips={strings('games.trust_world_tips')}
                context={this.context}
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

export default connect(mapStateToProps)(GamesDetailScreen);
