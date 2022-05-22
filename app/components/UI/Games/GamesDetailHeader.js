import React, { PureComponent } from 'react';
import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import WebsiteIcon from '../WebsiteIcon';

const createStyles = (colors) =>
  StyleSheet.create({
    wrapper: {
      ackgroundColor: colors.background.default,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 10,
    },
    websiteIcon: {
      width: 80,
      height: 80,
      backgroundColor: '#F8F8F8',
    },
    website: {
      color: '#00FFFF',
    },
  });

const GamesDetailHeader = (props) => {
  const colors = props.context.colors || mockTheme.colors;
  const styles = createStyles(colors);
  return (
    <View style={styles.wrapper}>
      <WebsiteIcon url={props.headerIcon} style={styles.websiteIcon} />
      <Text style={styles.website}>{props.website}</Text>
      <Text>{props.desc}</Text>
    </View>
  );
};

GamesDetailHeader.propTypes = {
  context: PropTypes.any,
  headerIcon: PropTypes.string,
  website: PropTypes.string,
  desc: PropTypes.string,
};

export default GamesDetailHeader;
