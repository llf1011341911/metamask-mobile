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
import { getGamesDetail } from "../../../UI/Games/fetch";

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
    detailData: this.props.route.params?.data ?? {},
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
    setTimeout(() => {
      this.getDetail()
    }, 100);
  }

  getDetail = async () => {
    const { detailData } = this.state
    if (detailData.id == null) {
      return
    }
    this.setState({
      loading: true
    })
    try {
      const detail = await getGamesDetail(detailData.id, '0x8e559d60c0bdb1c2946e16f92d1c5d82b9ace25b')
      console.log("详情返回" + JSON.stringify(detail))
      this.setState({
        detailData: {
          ...detailData,
          ...detail
        },
        loading: false
      })
    } catch (error) {
      console.log("详情返回" + error)
      this.setState({
        loading: false
      })
    }

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
                desc={detailData.desc}
                context={this.context}
              />

              <View style={{ marginTop: 20 }} />
              <GamesDetailAccountView
                accountId={detailData.id + '@' + detailData.world.name}
                email={detailData.email}
                address={detailData.address}
                context={this.context}
              />
              <GamesDetailTrustAdminView
                title={strings('games.trust_admin')}
                switchValue={false}
                tips={strings('games.trust_admin_tips')}
              />
              <GamesDetailTrustAdminView
                title={strings('games.trust_world')}
                switchValue={detailData.trustWorld}
                tips={strings('games.trust_world_tips')}
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
