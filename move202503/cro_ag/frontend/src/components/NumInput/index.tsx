import stringUtil from '@/utils/stringUtil';
import { ConfigProvider, InputNumber, InputNumberProps } from 'antd';
import React, { useRef, useState } from 'react';
export type ApyListProps = {
  currentValue: number;
  maxBalance: number;
  decimalPlaces: number;
  onInputChange: (value: number | null) => void;
  disabled?: boolean;
};
const NumInput: React.FC<ApyListProps> = ({
  currentValue,
  maxBalance,
  decimalPlaces,
  onInputChange,
  disabled,
}) => {
  const rawValueRef = useRef(0); // *******
  const [errorMsg, setErrorMsg] = useState('');
  const handleInput: InputNumberProps['onInput'] = (value) => {
    onExceed('');
    if (stringUtil.isEmpty(value)) {
      return;
    }
    const parsedRaw = parseFloat(value);
    if (isNaN(parsedRaw)) {
      onExceed('Invalid amount.');
      return;
    }
    if (parsedRaw !== rawValueRef.current) {
      onExceed('Amount exceeds balance.');
    }
  };
  const onExceed = (value: string) => {
    setErrorMsg(value);
  };
  const onInputChange1: InputNumberProps['onChange'] = (value) => {
    if (stringUtil.isNotEmpty(value)) {
      rawValueRef.current = Number(value);
      onInputChange(rawValueRef.current);
      onExceed('');
    } else {
      onInputChange(null);
    }
  };
  return (
    <ConfigProvider
      theme={{
        components: {
          InputNumber: {
            hoverBorderColor: '#00000000',
            hoverBg: '#00000000',
            activeBg: '#00000000',
            activeBorderColor: '#00000000',
            activeShadow: '0 0 0 2px rgba(8, 20, 53, 0)',
            inputFontSize: 54,
            lineHeight: 1,
            fontFamily: 'Regular, serif',
          },
        },
      }}
    >
      <div
        style={{
          position: 'relative',
          background: '#00000000',
          paddingTop: '33px',
          paddingBottom: '43px',
        }}
      >
        <InputNumber<number>
          disabled={disabled}
          min={0}
          max={maxBalance}
          defaultValue={0}
          controls={false}
          onChange={onInputChange1}
          stringMode
          value={currentValue}
          onInput={handleInput}
          precision={decimalPlaces}
          formatter={(value) => {
            return value?.toString() || '';
          }}
          onBlur={() => onExceed('')}
          style={{
            background: '#00000000',
            width: '100%',
            fontFamily: 'Regular, serif',
            border: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: '16px',
            bottom: '16px',
            fontFamily: 'Regular, serif',
            fontSize: '14px',
            color: '#ff4d4f',
          }}
        >
          {errorMsg}
        </div>
      </div>
    </ConfigProvider>
  );
};

export default NumInput;
