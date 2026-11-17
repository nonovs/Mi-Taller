import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

type Props = {
  color: string;
  width?: number;
};

/** Silueta lateral de un turismo pintada con el color real del coche. */
export function CarIllustration({ color, width = 280 }: Props) {
  const height = (width * 120) / 300;

  return (
    <Svg width={width} height={height} viewBox="0 0 300 120">
      <Ellipse cx={150} cy={108} rx={135} ry={7} fill="#000" opacity={0.15} />
      {/* Carrocería */}
      <Path
        d="M20 82 Q18 66 34 62 L78 56 Q98 30 128 26 L188 26 Q212 28 232 52 L268 58 Q284 62 284 78 L284 88 Q284 94 278 94 L22 94 Q18 94 20 82 Z"
        fill={color}
      />
      {/* Ventanillas */}
      <Path d="M92 56 Q108 36 130 34 L154 34 L154 56 Z" fill="#CFE3F2" opacity={0.9} />
      <Path d="M162 34 L186 34 Q204 36 220 56 L162 56 Z" fill="#CFE3F2" opacity={0.9} />
      {/* Brillo y detalles */}
      <Path d="M40 66 L270 66" stroke="#fff" strokeWidth={2} opacity={0.25} />
      <Rect x={164} y={64} width={14} height={3} rx={1.5} fill="#000" opacity={0.3} />
      <Rect x={110} y={64} width={14} height={3} rx={1.5} fill="#000" opacity={0.3} />
      <Rect x={272} y={68} width={10} height={8} rx={2} fill="#FFE8A3" />
      <Rect x={20} y={70} width={8} height={8} rx={2} fill="#E03131" />
      {/* Ruedas */}
      {[76, 228].map((cx) => (
        <G key={cx}>
          <Circle cx={cx} cy={94} r={20} fill="#1C1C1E" />
          <Circle cx={cx} cy={94} r={10} fill="#ADB5BD" />
          <Circle cx={cx} cy={94} r={3} fill="#495057" />
        </G>
      ))}
    </Svg>
  );
}
