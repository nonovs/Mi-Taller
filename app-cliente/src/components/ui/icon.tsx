import Svg, { Circle, Path, Rect } from 'react-native-svg';

const PATHS = {
  plus: <Path d="M12 5v14M5 12h14" />,
  check: <Path d="M20 6 9 17l-5-5" />,
  x: <Path d="M18 6 6 18M6 6l12 12" />,
  'chevron-right': <Path d="m9 18 6-6-6-6" />,
  logout: <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  search: (
    <>
      <Circle cx={11} cy={11} r={7} />
      <Path d="m21 21-4.3-4.3" />
    </>
  ),
  phone: (
    <Path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
  ),
  message: (
    <Path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8Z" />
  ),
  trash: <Path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />,
  clock: (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 7v5l3 2" />
    </>
  ),
  calendar: (
    <>
      <Rect x={3} y={4} width={18} height={18} rx={2} />
      <Path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  tool: (
    <Path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9Z" />
  ),
  key: (
    <>
      <Circle cx={7.5} cy={15.5} r={4.5} />
      <Path d="m10.7 12.3 9.8-9.8M17 6l3 3M14.5 8.5l2 2" />
    </>
  ),
  user: (
    <>
      <Circle cx={12} cy={8} r={4} />
      <Path d="M20 21a8 8 0 0 0-16 0" />
    </>
  ),
  mail: (
    <>
      <Rect x={3} y={5} width={18} height={14} rx={2} />
      <Path d="m3 7 9 6 9-6" />
    </>
  ),
  share: <Path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13" />,
  mic: (
    <>
      <Rect x={9} y={2} width={6} height={12} rx={3} />
      <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </>
  ),
  send: <Path d="M22 2 11 13M22 2l-7 20-4-9-9-4Z" />,
} as const;

export type IconName = keyof typeof PATHS | 'stop' | 'grip' | 'sparkles';

type Props = { name: IconName; color: string; size?: number; strokeWidth?: number };

/** Iconos de trazo (estilo Feather) dibujados con SVG. */
export function Icon({ name, color, size = 22, strokeWidth = 2 }: Props) {
  if (name === 'stop') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Rect x={6} y={6} width={12} height={12} rx={2.5} fill={color} />
      </Svg>
    );
  }
  if (name === 'grip') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        {[6, 12, 18].flatMap((y) => [
          <Circle key={`l${y}`} cx={9} cy={y} r={1.7} />,
          <Circle key={`r${y}`} cx={15} cy={y} r={1.7} />,
        ])}
      </Svg>
    );
  }
  if (name === 'sparkles') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <Path d="M10 3l1.9 5.1L17 10l-5.1 1.9L10 17l-1.9-5.1L3 10l5.1-1.9Z" />
        <Path d="M18 14l.9 2.1L21 17l-2.1.9L18 20l-.9-2.1L15 17l2.1-.9Z" />
      </Svg>
    );
  }

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round">
      {PATHS[name]}
    </Svg>
  );
}
