import { memo } from 'react';
import styled from '@emotion/styled';

const IconWrapper = styled.svg`
  display: inline-block;
  vertical-align: middle;
  margin-right: 4px;
`;

interface IconProps {
  color?: string;
}

const Icon = memo(({ color }: IconProps) => (
  <IconWrapper className="recharts-surface" width="14" height="14" viewBox="0 0 32 32" version="1.1">
    <path
      strokeWidth="4"
      fill="none"
      stroke={color ?? '#000'}
      d="M0,16h10.666666666666666
A5.333333333333333,5.333333333333333,0,1,1,21.333333333333332,16
H32M21.333333333333332,16
A5.333333333333333,5.333333333333333,0,1,1,10.666666666666666,16"
      className="recharts-legend-icon"
    ></path>
  </IconWrapper>
));

Icon.displayName = 'Icon';

export default Icon;
