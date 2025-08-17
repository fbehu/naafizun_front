import React, { useState, useRef, useEffect } from 'react';

interface VirtualKeyboardProps {
  initialValue: string; // Pass the initial value from the input
  onInput: (value: string) => void;
  onClose: () => void;
}

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ initialValue, onInput, onClose }) => {
  const [inputValue, setInputValue] = useState(initialValue); // Initialize with the input's current value
  const [isShiftActive, setIsShiftActive] = useState(false); // Toggle uppercase/lowercase
  const [isNumericKeyboard, setIsNumericKeyboard] = useState(false); // Toggle between default and numeric keyboard
  const [cursorPosition, setCursorPosition] = useState(initialValue.length); // Track cursor position
  const deleteIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null); // Ref for the input element

  useEffect(() => {
    setInputValue(initialValue); // Update the keyboard value when the input value changes
    setCursorPosition(initialValue.length); // Set cursor to end
  }, [initialValue]);

  useEffect(() => {
    // Remove cursor positioning logic
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputValue]);

  const handleKeyPress = (key: string) => {
    if (key === '◀️') {
      // Don't handle delete here, it's handled separately
      return;
    } else if (key === '←') {
      // Move cursor left
      setCursorPosition((prev) => Math.max(0, prev - 1));
    } else if (key === '→') {
      // Move cursor right
      setCursorPosition((prev) => Math.min(inputValue.length, prev + 1));
    } else if (key === 'space') {
      const newValue = inputValue.slice(0, cursorPosition) + ' ' + inputValue.slice(cursorPosition);
      setInputValue(newValue);
      setCursorPosition(cursorPosition + 1);
    } else if (key === '123') {
      setIsNumericKeyboard(true); // Switch to numeric keyboard
    } else if (key === 'ABC') {
      setIsNumericKeyboard(false); // Switch back to default keyboard
    } else if (key === '⏏️') {
      setIsShiftActive((prev) => !prev); // Toggle uppercase/lowercase
    } else if (key === 'enter') {
      handleConfirm(); // Submit and close the keyboard
    } else {
      // Insert character at cursor position
      const character = isShiftActive ? key.toUpperCase() : key.toLowerCase();
      const newValue = inputValue.slice(0, cursorPosition) + character + inputValue.slice(cursorPosition);
      setInputValue(newValue);
      setCursorPosition(cursorPosition + 1);
    }
  };

  const handleDeletePress = () => {
    // Delete one character at cursor position immediately
    if (cursorPosition > 0) {
      const newValue = inputValue.slice(0, cursorPosition - 1) + inputValue.slice(cursorPosition);
      setInputValue(newValue);
      setCursorPosition(cursorPosition - 1);
    }

    // Start a timeout to begin faster deletion after 1 second (like phone keyboards)
    deleteIntervalRef.current = setTimeout(() => {
      deleteIntervalRef.current = setInterval(() => {
        setCursorPosition((currentPos) => {
          if (currentPos > 0) {
            setInputValue((prev) => prev.slice(0, currentPos - 1) + prev.slice(currentPos));
            return currentPos - 1;
          }
          return currentPos;
        });
      }, 50); // Very fast deletion every 50ms
    }, 1000); // 1 second initial delay
  };

  const handleDeleteRelease = () => {
    // Stop both the timeout and the interval
    if (deleteIntervalRef.current) {
      clearTimeout(deleteIntervalRef.current);
      clearInterval(deleteIntervalRef.current);
      deleteIntervalRef.current = null;
    }
  };

  const handleConfirm = () => {
    onInput(inputValue); // Save the updated value to the parent component
    onClose(); // Close the keyboard
  };

  const defaultRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['⏏️', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '◀️'],
    ['123', '←', 'space', '→', '.', 'enter'],
  ];

  const numericRows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['ABC', '0', '◀️'],
  ];

  const rows = isNumericKeyboard ? numericRows : defaultRows;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 via-slate-800 to-slate-700 text-white p-4 z-[103] shadow-2xl border-t border-slate-600">
      <div className="flex justify-between items-center mb-3">
        <span className="text-lg font-semibold text-slate-200">O'zbekcha</span>
        <button 
          onClick={onClose} 
          className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-md transition-all duration-200 text-sm font-medium"
        >
          Yopish
        </button>
      </div>
      <div className="mb-4">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onClick={(e) => {
            const input = e.target as HTMLInputElement;
            const rect = input.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const textWidth = input.scrollWidth;
            const inputWidth = input.clientWidth;
            const charWidth = textWidth / inputValue.length;
            const clickPosition = Math.round(clickX / charWidth);
            setCursorPosition(Math.max(0, Math.min(inputValue.length, clickPosition)));
          }}
          className="w-full p-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 overflow-x-auto focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm cursor-text"
        />
      </div>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-1.5 mb-1.5">
          {row.map((key) => (
            <button
              key={key}
              onMouseDown={key === '◀️' ? handleDeletePress : undefined}
              onMouseUp={key === '◀️' ? handleDeleteRelease : undefined}
              onMouseLeave={key === '◀️' ? handleDeleteRelease : undefined}
              onTouchStart={key === '◀️' ? handleDeletePress : undefined}
              onTouchEnd={key === '◀️' ? handleDeleteRelease : undefined}
              onClick={key !== '◀️' ? () => handleKeyPress(key) : undefined}
              className={`
                ${isNumericKeyboard
                  ? key === 'ABC' || key === '◀️'
                    ? 'flex-1 py-3 px-2 rounded-lg text-center font-medium'
                    : 'flex-1 py-4 px-2 rounded-lg text-center font-semibold text-xl'
                  : key === '123'
                  ? 'py-3 px-3 w-14 h-12 rounded-lg text-center font-medium text-sm'
                  : 'py-3 px-2 rounded-lg text-center font-medium'
                } 
                transition-all duration-150 ease-out
                ${key === 'space' || key === 'ABC' ? 'flex-1 min-w-0' : 'w-10 h-12'}
                ${key === '⏏️' && isShiftActive 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                  : key === '◀️'
                  ? 'bg-red-500/80 hover:bg-red-500 active:bg-red-600 text-white shadow-lg shadow-red-500/20'
                  : key === 'enter'
                  ? 'bg-green-500/80 hover:bg-green-500 active:bg-green-600 text-white shadow-lg shadow-green-500/20'
                  : key === 'space'
                  ? 'bg-slate-600/80 hover:bg-slate-600 active:bg-slate-500 text-slate-200 shadow-md'
                  : 'bg-slate-600/60 hover:bg-slate-600 active:bg-slate-500 text-white shadow-md'
                }
                border border-slate-500/30 backdrop-blur-sm
                active:scale-95 hover:scale-105 hover:shadow-lg
                select-none
              `}
            >
              <span className="block">
                {key === 'enter' ? '↩️' : 
                 key === 'space' ? '⎵' :
                 key === '◀️' ? '⌫' :
                 isShiftActive && !isNumericKeyboard ? key.toUpperCase() : key.toLowerCase()}
              </span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

export default VirtualKeyboard;