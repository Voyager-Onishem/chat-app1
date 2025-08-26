import * as React from 'react';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import FormControl from '@mui/joy/FormControl';
import Textarea from '@mui/joy/Textarea';
import { IconButton, Stack } from '@mui/joy';

import FormatBoldRoundedIcon from '@mui/icons-material/FormatBoldRounded';
import FormatItalicRoundedIcon from '@mui/icons-material/FormatItalicRounded';
import StrikethroughSRoundedIcon from '@mui/icons-material/StrikethroughSRounded';
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';

export interface MessageInputProps {
  textAreaValue: string;
  setTextAreaValue: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
  maxRows?: number;
  minRows?: number;
}

export default function MessageInput(props: MessageInputProps) {
  const { 
    textAreaValue, 
    setTextAreaValue, 
    onSubmit, 
    disabled = false,
    placeholder = "Type something here…",
    maxRows = 10,
    minRows = 3
  } = props;
  
  const textAreaRef = React.useRef<HTMLDivElement>(null);
  
  const handleClick = React.useCallback(() => {
    if (textAreaValue.trim() !== '' && !disabled) {
      onSubmit();
      setTextAreaValue('');
    }
  }, [textAreaValue, disabled, onSubmit, setTextAreaValue]);

  const handleKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  const handleTextAreaChange = React.useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextAreaValue(event.target.value);
  }, [setTextAreaValue]);
  return (
    <Box sx={{ px: 2, pb: 3 }}>
      <FormControl>
        <Textarea
          placeholder={placeholder}
          aria-label="Message"
          ref={textAreaRef}
          onChange={handleTextAreaChange}
          onKeyDown={handleKeyDown}
          value={textAreaValue}
          minRows={minRows}
          maxRows={maxRows}
          disabled={disabled}
          endDecorator={
            <Stack
              direction="row"
              sx={{
                justifyContent: 'space-between',
                alignItems: 'center',
                flexGrow: 1,
                py: 1,
                pr: 1,
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              <div>
                <IconButton size="sm" variant="plain" color="neutral">
                  <FormatBoldRoundedIcon />
                </IconButton>
                <IconButton size="sm" variant="plain" color="neutral">
                  <FormatItalicRoundedIcon />
                </IconButton>
                <IconButton size="sm" variant="plain" color="neutral">
                  <StrikethroughSRoundedIcon />
                </IconButton>
                <IconButton size="sm" variant="plain" color="neutral">
                  <FormatListBulletedRoundedIcon />
                </IconButton>
              </div>
              <Button
                size="sm"
                color="primary"
                sx={{ alignSelf: 'center', borderRadius: 'sm' }}
                endDecorator={<SendRoundedIcon />}
                onClick={handleClick}
              >
                Send
              </Button>
            </Stack>
          }
          sx={{
            '& textarea:first-of-type': {
              minHeight: 72,
            },
          }}
        />
      </FormControl>
    </Box>
  );
}
