import type { ReactNode, SVGProps } from 'react'
import type { GlassId, GroupId } from '../data/types'

const INK = '#1D1A3B'
const GLASS_FILL = 'rgba(255,255,255,0.8)'

// ─── Icônes d'interface ─────────────────────────────────

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Icon({ size = 22, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export const PlusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
)
export const SearchIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M15.5 15.5 20 20" />
  </Icon>
)
export const BackIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Icon>
)
export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
)
export const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Icon>
)
export const SwapIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 9h13l-4-4M19 15H6l4 4" />
  </Icon>
)
export const SettingsIcon = (p: IconProps) => (
  <Icon strokeWidth={2.2} {...p}>
    <path d="M10.06 4.76L10.23 1.95A10.2 10.2 0 0 1 13.77 1.95L13.94 4.76A7.5 7.5 0 0 1 15.75 5.5L17.85 3.64A10.2 10.2 0 0 1 20.36 6.15L18.5 8.25A7.5 7.5 0 0 1 19.24 10.06L22.05 10.23A10.2 10.2 0 0 1 22.05 13.77L19.24 13.94A7.5 7.5 0 0 1 18.5 15.75L20.36 17.85A10.2 10.2 0 0 1 17.85 20.36L15.75 18.5A7.5 7.5 0 0 1 13.94 19.24L13.77 22.05A10.2 10.2 0 0 1 10.23 22.05L10.06 19.24A7.5 7.5 0 0 1 8.25 18.5L6.15 20.36A10.2 10.2 0 0 1 3.64 17.85L5.5 15.75A7.5 7.5 0 0 1 4.76 13.94L1.95 13.77A10.2 10.2 0 0 1 1.95 10.23L4.76 10.06A7.5 7.5 0 0 1 5.5 8.25L3.64 6.15A10.2 10.2 0 0 1 6.15 3.64L8.25 5.5A7.5 7.5 0 0 1 10.06 4.76Z" />
    <circle cx="12" cy="12" r="3.2" />
  </Icon>
)
export const EditIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />
  </Icon>
)
export const TrashIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </Icon>
)
export const CopyIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16 8V4H4v12h4" />
  </Icon>
)
export const FilterIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 5h16l-6 8v6l-4-2v-4z" />
  </Icon>
)
export const DownloadIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
  </Icon>
)
export const UploadIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 15V4M7 9l5-5 5 5M5 20h14" />
  </Icon>
)
export const ChevronDownIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 9l6 6 6-6" />
  </Icon>
)
export const CartIcon = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <Icon {...p}>
    <path d="M3 4h2.5l2.2 10.5a1.5 1.5 0 0 0 1.5 1.2h8.3a1.5 1.5 0 0 0 1.5-1.1L21 8H6.3" fill="none" />
    {filled && <path d="M7 9.5h12.6l-1.4 5H8z" fill="currentColor" stroke="none" />}
    <circle cx="9.5" cy="20" r="1.4" />
    <circle cx="17.5" cy="20" r="1.4" />
  </Icon>
)
export const CameraIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
    <circle cx="12" cy="13" r="3.5" />
  </Icon>
)
export const BarcodeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 5v14M7.5 5v14M11 5v14M13.5 5v14M17 5v14M20 5v14" />
  </Icon>
)
export const ShareIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3v12M7 8l5-5 5 5M5 14v6h14v-6" />
  </Icon>
)
export const HeartIcon =({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <Icon strokeWidth={2.4} {...p}>
    <path
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      fill={filled ? 'currentColor' : 'none'}
    />
  </Icon>
)
export const BottleTabIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M10 2h4v5c2.5 1 4 2.8 4 5.5V21a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-8.5C6 9.8 7.5 8 10 7z" />
    <path d="M6 14h12" />
  </Icon>
)
export const GlassTabIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 4h16l-8 9zM12 13v7M8 21h8" />
  </Icon>
)

// ─── Verres ─────────────────────────────────────────────

interface GlassDef {
  body: string
  liquid: string
  extra?: (color: string) => ReactNode
  /** Couleur du contenant quand le verre n'est pas transparent (mug, tiki). */
  bodyFill?: string
}

const STEM = (top: number, w = 24) => (
  <>
    <path d={`M32 ${top}V55`} />
    <path d={`M${32 - w / 2} 56.5H${32 + w / 2}`} />
  </>
)

const GLASS_DEFS: Record<GlassId, GlassDef> = {
  coupe: {
    body: 'M8 14H56C56 30 46 38 32 38C18 38 8 30 8 14Z',
    liquid: 'M11 19H53C51 30 43 35 32 35C21 35 13 30 11 19Z',
    extra: () => STEM(38),
  },
  martini: {
    body: 'M6 10H58L32 38Z',
    liquid: 'M12.5 15H51.5L32 33.5Z',
    extra: () => (
      <>
        {STEM(38)}
        <path d="M46 4L36 22" strokeWidth={2.5} />
        <circle cx="38" cy="18" r="3.5" fill="#9CCF5A" strokeWidth={2} />
      </>
    ),
  },
  tumbler: {
    body: 'M13 20H51L48 56H16Z',
    liquid: 'M15.6 29H48.4L46.1 53H17.9Z',
    extra: () => <rect x="22" y="31" width="13" height="13" rx="2" fill="rgba(255,255,255,.75)" strokeWidth={2} transform="rotate(-12 28 37)" />,
  },
  highball: {
    body: 'M18 6H46L44 58H20Z',
    liquid: 'M19.7 15H44.3L42.6 55H21.4Z',
    extra: () => <path d="M40 0L34 26" stroke="#FF4FA3" strokeWidth={4} />,
  },
  flute: {
    body: 'M24 4H40C41 20 40 34 32 38C24 34 23 20 24 4Z',
    liquid: 'M25.6 11H38.4C38.9 22 38 31.5 32 34.8C26 31.5 25.1 22 25.6 11Z',
    extra: () => (
      <>
        {STEM(38, 18)}
        <circle cx="30" cy="24" r="1.4" fill="#fff" stroke="none" />
        <circle cx="34" cy="18" r="1.4" fill="#fff" stroke="none" />
        <circle cx="31" cy="30" r="1.2" fill="#fff" stroke="none" />
      </>
    ),
  },
  vin: {
    body: 'M15 8H49C53 22 50 38 32 40C14 38 11 22 15 8Z',
    liquid: 'M14.6 22H49.4C49 32 44 37.3 32 37.4C20 37.3 15 32 14.6 22Z',
    extra: () => STEM(40, 22),
  },
  mug: {
    body: 'M12 14H44V52Q44 56 40 56H16Q12 56 12 52Z',
    liquid: 'M14 16H42V21H14Z',
    bodyFill: '#E39B5B',
    extra: () => (
      <>
        <path d="M44 22H50Q54 22 54 26V40Q54 44 50 44H44" />
        <path d="M18 28V48" stroke="#F6C08F" strokeWidth={3} />
      </>
    ),
  },
  tiki: {
    body: 'M17 6H47L49 58H15Z',
    liquid: 'M19 8H45V13H19Z',
    bodyFill: '#C98A4B',
    extra: () => (
      <>
        <path d="M22 22H29M35 22H42" strokeWidth={3.5} />
        <path d="M22 18L29 20M42 18L35 20" strokeWidth={2} />
        <rect x="25" y="34" width="14" height="10" rx="2" fill="#fff" strokeWidth={2.5} />
        <path d="M29 34V44M35 34V44" strokeWidth={2} />
      </>
    ),
  },
  hurricane: {
    body: 'M20 4H44C46 14 42 20 39 26C46 34 46 46 40 50H24C18 46 18 34 25 26C22 20 18 14 20 4Z',
    liquid: 'M22.4 11H41.6C42.4 16 40 21 36.5 26.5C43 34 43 44 38.5 47.5H25.5C21 44 21 34 27.5 26.5C24 21 21.6 16 22.4 11Z',
    extra: () => (
      <>
        <path d="M32 50V55" />
        <path d="M22 56.5H42" />
      </>
    ),
  },
  shot: {
    body: 'M19 22H45L42 56H22Z',
    liquid: 'M21.2 28H42.8L40.9 49H23.1Z',
  },
  irish: {
    body: 'M18 8H44V38Q44 44 38 44H24Q18 44 18 38Z',
    liquid: 'M20.5 18H41.5V38Q41.5 41.5 38 41.5H24Q20.5 41.5 20.5 38Z',
    extra: () => (
      <>
        <rect x="20.5" y="12" width="21" height="6" fill="#F5ECD8" stroke="none" />
        <path d="M44 14Q54 14 54 24Q54 34 44 34" />
        {STEM(44, 20)}
      </>
    ),
  },
}

export function GlassIcon({ glass, color, size = 48 }: { glass: GlassId; color: string; size?: number }) {
  const def = GLASS_DEFS[glass] ?? GLASS_DEFS.tumbler
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <g stroke={INK} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <path d={def.body} fill={def.bodyFill ?? GLASS_FILL} />
        <path d={def.liquid} fill={color} stroke="none" />
        {def.extra?.(color)}
        <path d={def.body} fill="none" />
      </g>
    </svg>
  )
}

// ─── Bouteilles ─────────────────────────────────────────

const BOTTLE_SHAPES: Record<GroupId, { body: string; cap?: string; label?: string }> = {
  spiritueux: {
    body: 'M15 10H25V18C25 22 33 24 33 32V66Q33 69 30 69H10Q7 69 7 66V32C7 24 15 22 15 18Z',
    cap: 'M14 3H26V10H14Z',
    label: 'M10 38H30V54H10Z',
  },
  liqueurs: {
    body: 'M16 12H24V26C33 28 36 35 36 45C36 59 28 69 20 69C12 69 4 59 4 45C4 35 7 28 16 26Z',
    cap: 'M15 5H25V12H15Z',
    label: 'M11 42H29V54H11Z',
  },
  aperitifs: {
    body: 'M17 8H23V24C23 28 31 30 31 38V69H9V38C9 30 17 28 17 24Z',
    cap: 'M16.5 3H23.5V10H16.5Z',
    label: 'M11 44H29V58H11Z',
  },
  bitters: {
    body: 'M15 30H25V34C30 34 32 37 32 40V69H8V40C8 37 10 34 15 34Z',
    cap: 'M14 20H26V30H14Z',
    label: 'M8 46H32V62H8Z',
  },
  softs: {
    body: 'M9 20Q9 16 13 16H27Q31 16 31 20V65Q31 69 27 69H13Q9 69 9 65Z',
    cap: 'M12 12H28V16H12Z',
    label: 'M9 34H31V46H9Z',
  },
  jus: {
    body: 'M8 30L14 18H26L32 30V69H8Z',
    cap: 'M14 12H26V18H14Z',
    label: 'M8 40H32V56H8Z',
  },
  sirops: {
    body: 'M10 18H30Q33 18 33 21V66Q33 69 30 69H10Q7 69 7 66V21Q7 18 10 18Z',
    cap: 'M15 6H25V18H15Z',
    label: 'M10 32H30V52H10Z',
  },
  frais: {
    body: 'M20 22C30 22 34 32 34 44C34 58 28 68 20 68C12 68 6 58 6 44C6 32 10 22 20 22Z',
    cap: 'M20 22C20 16 24 12 28 12',
  },
  epicerie: {
    body: 'M8 26H32V66Q32 69 29 69H11Q8 69 8 66Z',
    cap: 'M6 18H34V26H6Z',
    label: 'M8 38H32V54H8Z',
  },
}

export function BottleIcon({ group, color, size = 64 }: { group: GroupId; color: string; size?: number }) {
  const shape = BOTTLE_SHAPES[group]
  return (
    <svg width={(size * 40) / 72} height={size} viewBox="0 0 40 72" aria-hidden="true">
      <g stroke={INK} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round">
        {shape.cap && <path d={shape.cap} fill={group === 'frais' ? 'none' : INK} />}
        <path d={shape.body} fill={color} />
        {shape.label && <path d={shape.label} fill="#FFFBF3" />}
      </g>
    </svg>
  )
}
