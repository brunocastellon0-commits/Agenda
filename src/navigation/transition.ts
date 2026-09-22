import { Animated, Easing } from 'react-native';
import {
  StackCardInterpolationProps,
  StackCardStyleInterpolator,
  StackNavigationOptions,
} from '@react-navigation/stack';
import { TabAnimParams } from './types';

const DURACION_MS = 520;

export const SER_ESPEC_TRANSICION: StackNavigationOptions['transitionSpec'] = {
  open: {
    animation: 'timing',
    config: { duration: DURACION_MS, easing: Easing.inOut(Easing.cubic) },
  },
  close: {
    animation: 'timing',
    config: { duration: DURACION_MS, easing: Easing.inOut(Easing.cubic) },
  },
};

const { multiply } = Animated;

// Transición tipo Linux: la pantalla que entra desliza despacio (con leve zoom
// de entrada) y la que queda abajo hace zoom-out mientras la cubren. Nunca hay
// un corte seco: push y pop animan por igual, con dirección según params.anim.
export function interpoladorTab(params?: TabAnimParams): StackCardStyleInterpolator {
  const dir = params?.anim === 'slide_from_left' ? -1 : 1;
  return (props: StackCardInterpolationProps) => {
    const { current, next, inverted, layouts } = props;
    if (next) {
      const p = next.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      });
      return {
        cardStyle: {
          opacity: p.interpolate({ inputRange: [0, 1], outputRange: [1, 0.85] }),
          transform: [{ scale: p.interpolate({ inputRange: [0, 1], outputRange: [1, 0.96] }) }],
        },
      };
    }
    const p = current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });
    return {
      cardStyle: {
        transform: [
          {
            translateX: multiply(
              p.interpolate({
                inputRange: [0, 1],
                outputRange: [layouts.screen.width * dir, 0],
              }),
              inverted
            ),
          },
          { scale: p.interpolate({ inputRange: [0, 1], outputRange: [1.04, 1] }) },
        ],
      },
    };
  };
}