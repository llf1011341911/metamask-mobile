import React, { PureComponent } from 'react';
import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { strings } from '../../../../locales/i18n';
import { connect } from 'react-redux';
import { ThemeContext, mockTheme } from '../../../util/theme';

const createStyles = (colors) =>
  StyleSheet.create({
    wrapper: {
      ackgroundColor: colors.background.default,
      paddingHorizontal: 15,
    },
    accountTitle: {
      fontWeight: 'bold',
    },
    accountHorizontal:{
        flexDirection:"row",
        justifyContent:"center"
    },
    website:{
        color: '#00FFFF',
        fontSize:14
    },
    account:{
        fontSize:12,
        fontWeight: 'bold',
        flex:1
    },
    address:{
        color:"#999999",
        fontSize:12
    },
    emailTitle:{
        marginTop:16,
        fontWeight: 'bold'
    },
    eamil:{
        
    }
  });

const GamesDetailAccountView = (props) => {
  const colors = props.context.colors || mockTheme.colors;
  const styles = createStyles(colors);
  return (
    <View style={styles.wrapper}>
      <Text style={styles.accountTitle}>
        {strings('games.account_id_title')}
      </Text>
      <View style={styles.accountHorizontal}>
        <Text style={styles.account}>{props.accountId}</Text>
        <Text style={styles.website}>{strings("games.view_in_the_block_browser")}</Text>
      </View>
      <Text style={styles.address}>{props.address}</Text>
      <Text style={styles.emailTitle}>{strings('games.register_email')}</Text>
      <Text style={styles.eamil}>{props.email}</Text>
    </View>
  );
};

GamesDetailAccountView.propTypes = {
  context: PropTypes.any,
  accountId: PropTypes.string,
  address: PropTypes.string,
  email: PropTypes.string,
};

export default GamesDetailAccountView;
