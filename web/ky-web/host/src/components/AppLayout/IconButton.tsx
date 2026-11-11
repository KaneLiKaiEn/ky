import React from "react";

export type IconButtonVariant = "rail" | "favorite";

interface IconButtonProps {
  variant: IconButtonVariant;
  active?: boolean;
  title?: string;
  onClick?: () => void;
  children: React.ReactNode;
}

const IconButton: React.FC<IconButtonProps> = ({
  variant,
  active = false,
  title,
  onClick,
  children,
}) => {
  const className = `app-layout__icon-btn app-layout__icon-btn--${variant}${
    active ? " app-layout__icon-btn--active" : ""
  }`;

  return (
    <button type="button" title={title} onClick={onClick} className={className}>
      {children}
    </button>
  );
};

export default React.memo(IconButton);
