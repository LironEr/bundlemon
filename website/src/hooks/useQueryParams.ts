import { useLocation } from 'react-router';

export default function useQueryparams() {
  return new URLSearchParams(useLocation().search);
}
