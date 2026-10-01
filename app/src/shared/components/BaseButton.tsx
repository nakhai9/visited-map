import { Button, type ButtonProps } from "@mui/material";

export type BaseButtonProps = ButtonProps;

export default function BaseButton(props: BaseButtonProps) {
  return <Button {...props} />;
}
