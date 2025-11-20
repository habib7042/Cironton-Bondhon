import React from 'react';
import { Delete, Fingerprint } from 'lucide-react';

interface NumPadProps {
  onPress: (value: string) => void;
  onDelete: () => void;
  onBiometric?: () => void;
  disabled?: boolean;
}

interface ButtonKeyProps {
  val: string;
  onClick: () => void;
  disabled?: boolean;
}

const ButtonKey: React.FC<ButtonKeyProps> = ({ val, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    type="button"
    className="h-16 w-full flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 active:bg-white/20 transition-colors text-2xl font-medium text-white backdrop-blur-sm"
  >
    {val}
  </button>
);

export const NumPad: React.FC<NumPadProps> = ({ onPress, onDelete, onBiometric, disabled }) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-xs mx-auto mt-6">
      {keys.map((key) => (
        <ButtonKey key={key} val={key} onClick={() => onPress(key)} disabled={disabled} />
      ))}
      <div className="flex items-center justify-center">
        {onBiometric && (
          <button 
            onClick={onBiometric}
            className="h-16 w-full flex items-center justify-center rounded-2xl text-nova-accent hover:bg-nova-accent/10 transition-colors"
          >
            <Fingerprint size={32} />
          </button>
        )}
      </div>
      <ButtonKey val="0" onClick={() => onPress('0')} disabled={disabled} />
      <div className="flex items-center justify-center">
        <button
          onClick={onDelete}
          className="h-16 w-full flex items-center justify-center rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <Delete size={24} />
        </button>
      </div>
    </div>
  );
};