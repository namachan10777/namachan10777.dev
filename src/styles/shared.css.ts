import { createVar, style, type StyleRule } from "@vanilla-extract/css";
import { media, vars } from "./theme.css";

export const contentContainer = style({
  width: `calc(100% - ${vars.layout.contentGutter} - ${vars.layout.contentGutter})`,
  maxWidth: vars.layout.contentMaxWidth,
  marginInline: vars.layout.contentGutter,
});

// コンテンツ列の左右に通る縦罫
export const rail = style([
  contentContainer,
  {
    borderInline: `${vars.border.thin} solid ${vars.color.line}`,
    backgroundColor: vars.color.background,
  },
]);

// 要素の端からレール(縦罫)の中心までの距離
export const railOffset = createVar();

const marker = vars.color.marker;
const half = `calc(${vars.layout.markerSize} / 2)`;

// 縦罫と横罫の交点に描く十字マーカー。1つの疑似要素で左右両方を描画する
function crossMarkers(edge: "top" | "bottom"): StyleRule {
  const lineCenter = edge === "top" ? "0.5px" : "calc(100% - 0.5px)";
  return {
    content: '""',
    position: "absolute",
    top: `calc(${lineCenter} - ${half})`,
    left: `calc(-1 * ${railOffset} - ${half})`,
    width: `calc(100% + 2 * ${railOffset} + ${vars.layout.markerSize})`,
    height: vars.layout.markerSize,
    pointerEvents: "none",
    backgroundImage: Array(4)
      .fill(`linear-gradient(${marker}, ${marker})`)
      .join(", "),
    backgroundRepeat: "no-repeat",
    backgroundSize: `${vars.layout.markerSize} 1px, 1px ${vars.layout.markerSize}, ${vars.layout.markerSize} 1px, 1px ${vars.layout.markerSize}`,
    backgroundPosition: `left 0 top calc(${half} - 0.5px), left calc(${half} - 0.5px) top 0, right 0 top calc(${half} - 0.5px), right calc(${half} - 0.5px) top 0`,
  };
}

// ビューポート全幅に伸びる横罫
function fullBleedLine(edge: "top" | "bottom"): StyleRule {
  return {
    content: '""',
    position: "absolute",
    [edge]: 0,
    left: "-100vw",
    right: "-100vw",
    height: vars.border.thin,
    backgroundColor: vars.color.line,
    pointerEvents: "none",
  };
}

const ruledBase = style({
  position: "relative",
  vars: {
    [railOffset]: `calc(${vars.layout.contentPadding} + 0.5px)`,
  },
});

// 上辺に全幅罫と十字マーカーを持つブロック。先頭の要素では描画しない
export const ruled = style([
  ruledBase,
  {
    selectors: {
      "&::before": fullBleedLine("top"),
      "&::after": crossMarkers("top"),
      "&:first-child::before, &:first-child::after": { display: "none" },
    },
  },
]);

// 下辺に全幅罫と十字マーカーを持つブロック
export const ruledBottom = style([
  ruledBase,
  {
    selectors: {
      "&::before": fullBleedLine("bottom"),
      "&::after": crossMarkers("bottom"),
    },
  },
]);

// レール自体の上下端に十字マーカーを置く (header/footerの内側要素用)
export const railCrossTop = style({
  position: "relative",
  vars: { [railOffset]: "-0.5px" },
  selectors: {
    "&::after": { ...crossMarkers("top"), top: `calc(-0.5px - ${half})` },
  },
});

export const railCrossBottom = style({
  position: "relative",
  vars: { [railOffset]: "-0.5px" },
  selectors: {
    "&::after": {
      ...crossMarkers("bottom"),
      top: `calc(100% + 0.5px - ${half})`,
    },
  },
});

export const labelText = {
  fontFamily: vars.font.mono,
  fontSize: vars.fontSize.label,
  fontWeight: 500,
  letterSpacing: vars.letterSpacing.label,
  textTransform: "uppercase",
  color: vars.color.muted,
} satisfies StyleRule;

export const label = style(labelText);

// "[01] TITLE" 形式のセクション見出し
export const sectionLabel = style([
  labelText,
  {
    counterIncrement: "section",
    marginBlock: `0 ${vars.space.xl}`,
    "::before": {
      content: '"[" counter(section, decimal-leading-zero) "] "',
      color: vars.color.accent,
    },
  },
]);

export const interactiveSurface = style({
  border: `${vars.border.thin} solid ${vars.color.line}`,
  backgroundColor: vars.color.background,
  color: vars.color.text,
  cursor: "pointer",
  transition: `border-color ${vars.motion.fast} ${vars.motion.easing}, color ${vars.motion.fast} ${vars.motion.easing}, background-color ${vars.motion.fast} ${vars.motion.easing}`,
  ":hover": {
    borderColor: vars.color.accent,
    backgroundColor: vars.color.surface,
    color: vars.color.accent,
  },
});

// 期間 | 内容 の2カラムで並べる経歴の行
export const timelineEntry = style({
  display: "grid",
  gridTemplateColumns: "9rem minmax(0, 1fr)",
  columnGap: vars.space.lg,
  rowGap: vars.space.xs,
  "@media": {
    [media.mobile]: { gridTemplateColumns: "minmax(0, 1fr)" },
  },
});

export const timelinePeriod = style({
  fontFamily: vars.font.mono,
  fontSize: vars.fontSize.small,
  color: vars.color.muted,
  paddingBlockStart: "0.1em",
});

export const timelineBody = style({
  display: "flex",
  flexDirection: "column",
  gap: vars.space.xs,
});

export const timelineTitle = style({
  fontWeight: 600,
});

export const timelineMeta = style({
  display: "grid",
  gridTemplateColumns: "5rem minmax(0, 1fr)",
  columnGap: vars.space.sm,
  margin: 0,
  fontSize: vars.fontSize.small,
});

export const timelineMetaKey = style([
  labelText,
  { paddingBlockStart: "0.2em" },
]);

export const timelineMetaValue = style({ margin: 0 });
