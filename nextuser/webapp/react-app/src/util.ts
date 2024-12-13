import { format } from 'date-fns';

export function to_date_str(time_ms : number) : string{
  let d = new Date(time_ms);
  return format(d,'yyyy-MM-dd HH:mm');
}

const SUI_OVER_FROST = 1e9;
export function sui_show( amount : number) : string{
   return (amount >= SUI_OVER_FROST || amount == 0) ?  String(amount/SUI_OVER_FROST) + " SUI"
                           :  String(amount ) + " FROST";
}
