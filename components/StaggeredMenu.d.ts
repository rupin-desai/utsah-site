// Hand-written types for the registry-installed StaggeredMenu.jsx.
declare const StaggeredMenu: (props: {
  position?: 'left' | 'right';
  colors?: string[];
  items?: { label: string; link: string; ariaLabel?: string }[];
  socialItems?: { label: string; link: string; icon?: React.ReactNode }[];
  displaySocials?: boolean;
  displayItemNumbering?: boolean;
  className?: string;
  logoUrl?: string;
  menuButtonColor?: string;
  openMenuButtonColor?: string;
  accentColor?: string;
  changeMenuColorOnOpen?: boolean;
  isFixed?: boolean;
  closeOnClickAway?: boolean;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
}) => React.ReactNode;

export default StaggeredMenu;
