import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  TouchableOpacity,
  StyleSheet,
  View,
  InteractionManager,
  Image,
} from 'react-native';
import { connect } from 'react-redux';
import { fontStyles } from '../../../styles/common';
import { strings } from '../../../../locales/i18n';
import Engine from '../../../core/Engine';
import CollectibleContractElement from '../CollectibleContractElement';
import Analytics from '../../../core/Analytics';
import { ANALYTICS_EVENT_OPTS } from '../../../util/analytics';
import {
  collectibleContractsSelector,
  collectiblesSelector,
  favoritesCollectiblesSelector,
} from '../../../reducers/collectibles';
import { removeFavoriteCollectible } from '../../../actions/collectibles';
import { setNftDetectionDismissed } from '../../../actions/user';
import Text from '../../Base/Text';
import AppConstants from '../../../core/AppConstants';
import { toLowerCaseEquals } from '../../../util/general';
import { compareTokenIds } from '../../../util/tokens';
import CollectibleDetectionModal from '../CollectibleDetectionModal';
import { isMainNet } from '../../../util/networks';
import { useAppThemeFromContext, mockTheme } from '../../../util/theme';

const createStyles = (colors) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: colors.background.default,
      flex: 1,
      minHeight: 500,
      marginTop: 16,
    },
    emptyView: {
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 10,
    },
    add: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    addText: {
      fontSize: 14,
      color: colors.primary.default,
      ...fontStyles.normal,
    },
    footer: {
      flex: 1,
      paddingBottom: 30,
      alignItems: 'center',
      marginTop: 24,
    },
    emptyContainer: {
      flex: 1,
      marginBottom: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyImageContainer: {
      width: 76,
      height: 76,
      marginTop: 30,
      marginBottom: 12,
      tintColor: colors.icon.default,
    },
    emptyTitleText: {
      fontSize: 24,
      color: colors.text.alternative,
    },
    emptyText: {
      color: colors.text.alternative,
      marginBottom: 8,
      fontSize: 14,
    },
  });

/**
 * View that renders a list of CollectibleContract
 * ERC-721 and ERC-1155
 */
const CollectibleContracts = ({
  selectedAddress,
  chainId,
  navigation,
  collectibleContracts,
  collectibles,
  favoriteCollectibles,
  removeFavoriteCollectible,
  useCollectibleDetection,
  setNftDetectionDismissed,
  nftDetectionDismissed,
  show,
}) => {
  const { colors } = useAppThemeFromContext() || mockTheme;
  const styles = createStyles(colors);
  const [isAddNFTEnabled, setIsAddNFTEnabled] = useState(true);

  const onItemPress = useCallback(
    (collectible, contractName) => {
      navigation.navigate('CollectiblesDetails', { collectible, contractName });
    },
    [navigation],
  );

  /**
   *  Method to check the token id data type of the current collectibles.
   *
   * @param collectible - Collectible object.
   * @returns Boolean indicating if the collectible should be updated.
   */
  const shouldUpdateCollectibleMetadata = (collectible) =>
    typeof collectible.tokenId === 'number';

  /**
   * Method to updated collectible and avoid backwards compatibility issues.
   * @param address - Collectible address.
   * @param tokenId - Collectible token ID.
   */
  const updateCollectibleMetadata = (collectible) => {
    const { CollectiblesController } = Engine.context;
    const { address, tokenId } = collectible;
    CollectiblesController.removeCollectible(address, tokenId);
    if (String(tokenId).includes('e+')) {
      removeFavoriteCollectible(selectedAddress, chainId, collectible);
    } else {
      CollectiblesController.addCollectible(address, String(tokenId));
    }
  };

  useEffect(() => {
    // TO DO: Move this fix to the controllers layer
    collectibles.forEach((collectible) => {
      if (shouldUpdateCollectibleMetadata(collectible)) {
        updateCollectibleMetadata(collectible);
      }
    });
  });

  const goToAddCollectible = () => {
    setIsAddNFTEnabled(false);
    navigation.push('AddAsset', { assetType: 'collectible' });
    InteractionManager.runAfterInteractions(() => {
      Analytics.trackEvent(ANALYTICS_EVENT_OPTS.WALLET_ADD_COLLECTIBLES);
      setIsAddNFTEnabled(true);
    });
  };

  const renderFooter = () => (
    <View style={styles.footer} key={'collectible-contracts-footer'}>
      <Text style={styles.emptyText}>{strings('wallet.no_collectibles')}</Text>
      <TouchableOpacity
        style={styles.add}
        onPress={goToAddCollectible}
        disabled={!isAddNFTEnabled}
        testID={'add-collectible-button'}
      >
        <Text style={styles.addText}>{strings('wallet.add_collectibles')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCollectibleContract = useCallback(
    (item, index) => {
      const contractCollectibles = collectibles?.filter((collectible) =>
        toLowerCaseEquals(collectible.address, item.address),
      );
      return (
        <CollectibleContractElement
          onPress={onItemPress}
          asset={item}
          key={item.address}
          contractCollectibles={contractCollectibles}
          collectiblesVisible={index === 0}
        />
      );
    },
    [collectibles, onItemPress],
  );

  const renderFavoriteCollectibles = useCallback(() => {
    const filteredCollectibles = favoriteCollectibles.map((collectible) =>
      collectibles.find(
        ({ tokenId, address }) =>
          compareTokenIds(collectible.tokenId, tokenId) &&
          collectible.address === address,
      ),
    );
    return (
      Boolean(filteredCollectibles.length) && (
        <CollectibleContractElement
          onPress={onItemPress}
          asset={{ name: 'Favorites', favorites: true }}
          key={'Favorites'}
          contractCollectibles={filteredCollectibles}
          collectiblesVisible
        />
      )
    );
  }, [favoriteCollectibles, collectibles, onItemPress]);

  const renderList = useCallback(
    () => (
      <View>
        {renderFavoriteCollectibles()}
        <View>
          {collectibleContracts?.map((item, index) =>
            renderCollectibleContract(item, index),
          )}
        </View>
      </View>
    ),
    [
      collectibleContracts,
      renderFavoriteCollectibles,
      renderCollectibleContract,
    ],
  );

  const goToLearnMore = () =>
    navigation.navigate('Webview', {
      screen: 'SimpleWebview',
      params: { url: AppConstants.URLS.NFT },
    });

  const dismissNftInfo = async () => {
    setNftDetectionDismissed(true);
  };

  const renderEmpty = () => (
    <View style={styles.emptyView}>
      <View style={styles.emptyContainer}>
        <Image
          style={styles.emptyImageContainer}
          source={require('../../../images/no-nfts-placeholder.png')}
          resizeMode={'contain'}
        />
        <Text center style={styles.emptyTitleText} bold>
          {strings('wallet.no_nfts_yet')}
        </Text>
        <Text center big link onPress={goToLearnMore}>
          {strings('wallet.learn_more')}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.wrapper} testID={'collectible-contracts'}>
      {isMainNet(chainId) &&
        !nftDetectionDismissed &&
        !useCollectibleDetection && show &&(
          <View style={styles.emptyView}>
            <CollectibleDetectionModal
              onDismiss={dismissNftInfo}
              navigation={navigation}
            />
          </View>
        )}
      {collectibleContracts.length > 0 ? renderList() : show?renderEmpty():null}
      {renderFooter()}
    </View>
  );
};

CollectibleContracts.propTypes = {
  /**
   * Chain id
   */
  chainId: PropTypes.string,
  /**
   * Selected address
   */
  selectedAddress: PropTypes.string,
  /**
   * Array of collectibleContract objects
   */
  collectibleContracts: PropTypes.array,
  /**
   * Array of collectibles objects
   */
  collectibles: PropTypes.array,
  /**
   * Navigation object required to push
   * the Asset detail view
   */
  navigation: PropTypes.object,
  /**
   * Object of collectibles
   */
  favoriteCollectibles: PropTypes.array,
  /**
   * Dispatch remove collectible from favorites action
   */
  removeFavoriteCollectible: PropTypes.func,
  /**
   * Boolean to show if NFT detection is enabled
   */
  useCollectibleDetection: PropTypes.bool,
  /**
   * Setter for NFT detection state
   */
  setNftDetectionDismissed: PropTypes.func,
  /**
   * State to manage display of modal
   */
  nftDetectionDismissed: PropTypes.bool,

  show:PropTypes.bool
};

const mapStateToProps = (state) => ({
  chainId: state.engine.backgroundState.NetworkController.provider.chainId,
  selectedAddress:
    state.engine.backgroundState.PreferencesController.selectedAddress,
  useCollectibleDetection:
    state.engine.backgroundState.PreferencesController.useCollectibleDetection,
  nftDetectionDismissed: state.user.nftDetectionDismissed,
  collectibleContracts: collectibleContractsSelector(state),
  collectibles: collectiblesSelector(state),
  favoriteCollectibles: favoritesCollectiblesSelector(state),
});

const mapDispatchToProps = (dispatch) => ({
  removeFavoriteCollectible: (selectedAddress, chainId, collectible) =>
    dispatch(removeFavoriteCollectible(selectedAddress, chainId, collectible)),
  setNftDetectionDismissed: () => dispatch(setNftDetectionDismissed()),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(CollectibleContracts);
