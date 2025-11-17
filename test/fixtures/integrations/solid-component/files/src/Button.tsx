import type { Component } from "solid-js";

const Button: Component<{ label: string }> = ({ label }) => {
  const isActive = label.length > 0;

  return (
    <button class="text-sm px-2">
      {isActive && label}
    </button>
  );
};

export default Button;
