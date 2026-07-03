'use client';
import { useState } from 'react';
import { SectionBlock, F, inp, grid3 } from '../shared/styles';

export function AdditionalTab() {
  const [policeReportNo, setPoliceReportNo] = useState('');
  const [policeStation, setPoliceStation] = useState('');
  const [policeOfficerName, setPoliceOfficerName] = useState('');
  const [policeOfficerPhone, setPoliceOfficerPhone] = useState('');
  const [witnessName, setWitnessName] = useState('');
  const [witnessPhone, setWitnessPhone] = useState('');
  const [witnessEmail, setWitnessEmail] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  return (
    <>
      <SectionBlock title="Police Report">
        <div style={grid3}>
          <F label="Report number"><input style={inp} value={policeReportNo} onChange={e => setPoliceReportNo(e.target.value)} placeholder="e.g. E12345678" /></F>
          <F label="Police station"><input style={inp} value={policeStation} onChange={e => setPoliceStation(e.target.value)} /></F>
          <F label="Officer name"><input style={inp} value={policeOfficerName} onChange={e => setPoliceOfficerName(e.target.value)} /></F>
          <F label="Officer phone"><input style={inp} value={policeOfficerPhone} onChange={e => setPoliceOfficerPhone(e.target.value)} /></F>
        </div>
      </SectionBlock>
      <SectionBlock title="Witness Details">
        <div style={grid3}>
          <F label="Witness name"><input style={inp} value={witnessName} onChange={e => setWitnessName(e.target.value)} /></F>
          <F label="Witness phone"><input style={inp} value={witnessPhone} onChange={e => setWitnessPhone(e.target.value)} /></F>
          <F label="Witness email"><input style={inp} value={witnessEmail} onChange={e => setWitnessEmail(e.target.value)} /></F>
        </div>
      </SectionBlock>
      <SectionBlock title="Additional Notes">
        <textarea style={{ ...inp, height: '120px', resize: 'vertical' }} value={additionalNotes} onChange={e => setAdditionalNotes(e.target.value)} placeholder="Any other relevant details..." />
      </SectionBlock>
    </>
  );
}
