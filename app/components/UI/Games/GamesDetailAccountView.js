import React, { PureComponent } from 'react';
import {
  ActivityIndicator,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';
import { strings } from '../../../../locales/i18n';
import { connect } from 'react-redux';
import { ThemeContext, mockTheme } from '../../../util/theme';

const styles = StyleSheet.create({
  accountTitle: {
    backgroundColor: '#eee'
  }
})

const GamesDetailAccountView =(props) =>{

     return <View>
        <Text style={styles.accountTitle}>{strings('games.account_id_title')}</Text>
        <View>
            <Text>{props.accountId}</Text>
            <Text>在区块浏览器中查看</Text>
        </View>
        <Text>{props.address}</Text>
        <Text>{strings('games.register_email')}</Text>
        <Text>{props.email}</Text>
    </View>
};

GamesDetailAccountView.propTypes = {
    accountId:PropTypes.string,
    address:PropTypes.string,
    email:PropTypes.string,
};


export default GamesDetailAccountView;
