import React, { PureComponent } from 'react';
import {
  ActivityIndicator,
  InteractionManager,
  View,
  StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { swapsUtils } from '@metamask/swaps-controller/';
import {
  TX_UNAPPROVED,
  TX_SUBMITTED,
  TX_SIGNED,
  TX_PENDING,
  TX_CONFIRMED,
} from '../../../../constants/transaction';
import AssetOverview from '../../../UI/AssetOverview';
import Games from '../../../UI/Games';
import { getNetworkNavbarOptions } from '../../../UI/Navbar';
import Engine from '../../../../core/Engine';
import { sortTransactions } from '../../../../util/activity';
import { safeToChecksumAddress } from '../../../../util/address';
import { addAccountTimeFlagFilter } from '../../../../util/transactions';
import { toLowerCaseEquals } from '../../../../util/general';
import { ThemeContext, mockTheme } from '../../../../util/theme';

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
class GamesListScreen extends PureComponent {
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

  

  updateNavBar = () => {
    const { navigation, route } = this.props;
    const colors = this.context.colors || mockTheme.colors;
    navigation.setOptions(
      getNetworkNavbarOptions(
        route.params?.title ?? '',
        false,
        navigation,
        colors,
        true
      ),
    );
  };

  componentDidMount() {
    this.updateNavBar();
  }

  componentDidUpdate(prevProps) {
    this.updateNavBar();
  }

  componentWillUnmount() {
    this.mounted = false;
  }


  render = () => {

    const {
      route: { params },
      navigation,
      conversionRate,
      currentCurrency,
      selectedAddress,
      chainId,
    } = this.props;
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <View style={styles.wrapper}>
          <Games
            navigation={navigation}
            selectedAddress={selectedAddress}
            conversionRate={conversionRate}
            currentCurrency={currentCurrency}
            networkType={chainId}
          />
      </View>
    );
  };
}

GamesListScreen.contextType = ThemeContext;

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

export default connect(mapStateToProps)(GamesListScreen);
