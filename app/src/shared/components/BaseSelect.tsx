import { MenuItem, TextField, type TextFieldProps } from "@mui/material";

export type BaseSelectOption = {
  label: string;
  value: string;
};

export type BaseSelectProps = Omit<
  TextFieldProps,
  "select" | "children" | "variant"
> & {
  options: BaseSelectOption[];
};

export default function BaseSelect({
  options,
  size = "small",
  ...props
}: BaseSelectProps) {
  return (
    <TextField select size={size} {...props}>
      {options.map((opt) => (
        <MenuItem key={opt.value} value={opt.value}>
          {opt.label}
        </MenuItem>
      ))}
    </TextField>
  );
}
