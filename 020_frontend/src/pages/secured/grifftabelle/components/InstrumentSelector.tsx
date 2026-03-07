import { useAllInstruments } from '../hooks/useFingering';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface InstrumentSelectorProps {
  value: string;
  onChange: (id: string) => void;
}

export function InstrumentSelector({ value, onChange }: InstrumentSelectorProps) {
  const instruments = useAllInstruments();

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Instrument wählen…" />
      </SelectTrigger>
      <SelectContent>
        {instruments.map(inst => (
          <SelectItem key={inst.instrumentId} value={inst.instrumentId}>
            {inst.metadata.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
