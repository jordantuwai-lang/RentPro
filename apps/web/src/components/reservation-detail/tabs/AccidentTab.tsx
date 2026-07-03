'use client';
import { useRezForm } from '../ReservationFormContext';
import { SectionBlock, F, inp, grid3 } from '../shared/styles';

export function AccidentTab() {
  const { accDate, setAccDate, accStreet, setAccStreet, accSuburb, setAccSuburb, accDescription, setAccDescription } = useRezForm();

  return (
    <SectionBlock title="Accident Details">
      <div style={grid3}>
        <F label="Date of accident"><input type="date" style={inp} value={accDate} onChange={e => setAccDate(e.target.value)} /></F>
        <F label="Street / location"><input style={inp} value={accStreet} onChange={e => setAccStreet(e.target.value)} /></F>
        <F label="Suburb"><input style={inp} value={accSuburb} onChange={e => setAccSuburb(e.target.value)} /></F>
        <F label="Description" full>
          <textarea style={{ ...inp, height: '80px', resize: 'vertical' }} value={accDescription} onChange={e => setAccDescription(e.target.value)} />
        </F>
      </div>
    </SectionBlock>
  );
}
