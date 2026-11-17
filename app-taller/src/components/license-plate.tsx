import { StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/constants/theme';

type Props = {
  plate: string;
  size?: 'small' | 'large';
};

/** Matrícula española: franja azul de la UE con la "E" y los caracteres en negro sobre blanco. */
export function LicensePlate({ plate, size = 'large' }: Props) {
  const large = size === 'large';

  return (
    <View style={[styles.plate, large ? styles.plateLarge : styles.plateSmall]}>
      <View style={[styles.euStrip, { width: large ? 26 : 16 }]}>
        <Text style={[styles.stars, { fontSize: large ? 9 : 6 }]}>★★★</Text>
        <Text style={[styles.country, { fontSize: large ? 14 : 9 }]}>E</Text>
      </View>
      <Text style={[styles.number, { fontSize: large ? 28 : 16 }]}>{plate.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    flexDirection: 'row',
    alignItems: 'stretch',
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#111111',
    overflow: 'hidden',
  },
  plateLarge: { borderWidth: 2, borderRadius: 6, height: 48 },
  plateSmall: { borderWidth: 1.5, borderRadius: 4, height: 28 },
  euStrip: {
    backgroundColor: '#003399',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 3,
  },
  stars: { color: '#FFCC00', marginBottom: 'auto', marginTop: 3 },
  country: { color: '#ffffff', fontWeight: 700 },
  number: {
    color: '#111111',
    fontFamily: Fonts.mono,
    fontWeight: 700,
    letterSpacing: 2,
    paddingHorizontal: 12,
    alignSelf: 'center',
  },
});
