import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Home, CreditCard, Flame, User } from 'lucide-react-native';
import { COLORS } from '../theme';

const TAB_COUNT = 4;

const TAB_CONFIG = [
  { name: 'Home', label: 'Home', Icon: Home },
  { name: 'Payments', label: 'Premium', Icon: CreditCard },
  { name: 'Streak', label: 'Streak', Icon: Flame },
  { name: 'Profile', label: 'Profile', Icon: User },
];

export default function CustomTabBar({ state, descriptors, navigation }) {
  const { width: windowWidth } = useWindowDimensions();
  // We want the tab bar to have some padding from the edges
  const PADDING_HORIZONTAL = 20;
  const TAB_BAR_WIDTH = windowWidth - (PADDING_HORIZONTAL * 2);
  const TAB_WIDTH = TAB_BAR_WIDTH / TAB_COUNT;

  const indicatorAnim = useRef(new Animated.Value(0)).current;

  // Track animation state for each tab (0 = inactive, 1 = active)
  const tabAnims = useRef(TAB_CONFIG.map((_, i) => new Animated.Value(i === state.index ? 1 : 0))).current;

  useEffect(() => {
    // Slide the top glowing indicator
    Animated.spring(indicatorAnim, {
      toValue: state.index * TAB_WIDTH,
      useNativeDriver: true,
      friction: 6,
      tension: 50,
    }).start();

    // Animate all tabs
    const animations = tabAnims.map((anim, i) => {
      return Animated.spring(anim, {
        toValue: i === state.index ? 1 : 0,
        useNativeDriver: true,
        friction: 5,
        tension: 60,
      });
    });

    Animated.parallel(animations).start();
  }, [state.index, TAB_WIDTH]);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { width: TAB_BAR_WIDTH }]}>
        
        {/* Animated Top Glow Indicator */}
        <Animated.View
          style={[
            styles.indicatorContainer,
            { width: TAB_WIDTH },
            { transform: [{ translateX: indicatorAnim }] },
          ]}
        >
          <View style={styles.indicatorGlow} />
          <View style={styles.indicatorLine} />
        </Animated.View>

        {TAB_CONFIG.map((tab, index) => {
          const isFocused = state.index === index;
          const { Icon } = tab;
          const anim = tabAnims[index];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: state.routes[index].key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(state.routes[index].name);
            }
          };

          // Icon jumps up slightly
          const iconTranslateY = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [6, -2],
          });

          // Text drops down and fades in
          const labelOpacity = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          });

          const labelTranslateY = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [-5, 0],
          });

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={onPress}
              style={styles.tab}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  styles.iconWrapper,
                  { transform: [{ translateY: iconTranslateY }] },
                ]}
              >
                <Icon
                  size={isFocused ? 24 : 24}
                  color={isFocused ? COLORS.primary : '#A0AEC0'}
                  strokeWidth={isFocused ? 2.5 : 2}
                />
              </Animated.View>
              
              <Animated.View 
                style={[
                  styles.labelContainer,
                  {
                    opacity: labelOpacity,
                    transform: [{ translateY: labelTranslateY }],
                  }
                ]}
              >
                <Text style={styles.label} numberOfLines={1}>
                  {tab.label}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 35 : 25,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    elevation: 0,
    zIndex: 1000,
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF', 
    height: 70,
    borderRadius: 25,
    elevation: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  indicatorContainer: {
    position: 'absolute',
    top: 0,
    height: 4,
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 0,
  },
  indicatorLine: {
    width: 30,
    height: 4,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  indicatorGlow: {
    position: 'absolute',
    top: 0,
    width: 40,
    height: 15,
    backgroundColor: COLORS.primary,
    opacity: 0.2,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    filter: 'blur(4px)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    position: 'absolute',
    bottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.2,
  },
});
