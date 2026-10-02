import {
  Autocomplete,
  TextField,
  createFilterOptions,
  type SxProps,
  type Theme,
} from "@mui/material";

export type BaseAutocompleteOption = {
  label: string;
  value: string;
};

export type BaseAutocompleteProps = {
  options: BaseAutocompleteOption[];
  /** `value` của option đang chọn; rỗng/không khớp = chưa chọn. */
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  size?: "small" | "medium";
  sx?: SxProps<Theme>;
};

/** Bỏ dấu tiếng Việt để gõ "ha noi" vẫn khớp "Hà Nội". */
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

const filterOptions = createFilterOptions<BaseAutocompleteOption>({
  stringify: (opt) => normalize(opt.label),
  ignoreAccents: false,
  ignoreCase: false,
  // `inputValue` được chuẩn hoá bên dưới trước khi so khớp
});

export default function BaseAutocomplete({
  options,
  value,
  onChange,
  label,
  placeholder,
  disabled,
  size = "small",
  sx,
}: BaseAutocompleteProps) {
  const selected = options.find((opt) => opt.value === value) ?? null;

  return (
    <Autocomplete
      options={options}
      value={selected}
      disabled={disabled}
      size={size}
      disableClearable
      autoHighlight
      noOptionsText="Không tìm thấy"
      isOptionEqualToValue={(opt, val) => opt.value === val.value}
      getOptionLabel={(opt) => opt.label}
      filterOptions={(opts, state) =>
        filterOptions(opts, {
          ...state,
          inputValue: normalize(state.inputValue),
        })
      }
      onChange={(_, opt) => onChange(opt.value)}
      renderInput={(params) => (
        <TextField {...params} label={label} placeholder={placeholder} />
      )}
      sx={sx}
    />
  );
}
