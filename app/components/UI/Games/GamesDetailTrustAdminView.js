import React, { PureComponent } from 'react';
import {
  ActivityIndicator,
  Text,
  View,
  StyleSheet,
  Switch,
  colors
} from 'react-native';

import PropTypes, { any } from 'prop-types';
import { strings } from '../../../../locales/i18n';
import { connect } from 'react-redux';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { fontStyles } from '../../../styles/common';

const styles = StyleSheet.create({
  wrapper: {
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 8,
    paddingBottom: 8,
  },
  titleView: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    ...fontStyles.bold,
    fontSize: 16,
    flex: 1,
  },
  tips: {
    ...fontStyles.normal,
    fontSize: 12,
    marginTop: 8,
  },
})

class GamesDetailTrustAdminView extends PureComponent {

  static propTypes = {
    title: PropTypes.string,
    tips: PropTypes.string,
    switchValue: PropTypes.bool,
  };

  state = {
    select: this.props.switchValue
  }

  render() {
    const props = this.props
    const colors = this.context.colors || mockTheme.colors;

    return <View style={styles.wrapper}>

      <View style={styles.titleView}>
        <Text style={styles.title}>{props.title}</Text>
        <Switch
          value={this.state.select}
          onValueChange={() => {
            this.setState({
              select: !this.state.select
            })
          }}
          trackColor={{
            true: colors.primary.default,
            false: colors.border.muted,
          }}
          thumbColor={colors.white}
          style={styles.switch}
          ios_backgroundColor={colors.border.muted}
        />
      </View>
      <Text style={styles.tips}>{props.tips}</Text>
    </View>
  }
}

export default GamesDetailTrustAdminView;
