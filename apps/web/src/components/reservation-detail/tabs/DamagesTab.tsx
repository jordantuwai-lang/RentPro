'use client';
import { useState } from 'react';
import { useRezForm } from '../ReservationFormContext';
import { SectionBlock } from '../shared/styles';
import { DamageSelector } from '../shared/damage-diagrams';

export function DamagesTab() {
  const { reservation: r, nafRego, nafMake, nafModel, nafYear, nafBodyType } = useRezForm();
  const [damagedPanels, setDamagedPanels] = useState<Set<string>>(new Set());
  const [damageDescription, setDamageDescription] = useState('');
  const togglePanel = (panel: string) => setDamagedPanels(prev => { const n = new Set(prev); n.has(panel) ? n.delete(panel) : n.add(panel); return n; });

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', flex: 1 }}>
          {[
            { label: 'Rego', value: nafRego || r?.vehicle?.registration || '—' },
            { label: 'Make', value: nafMake || r?.vehicle?.make || '—' },
            { label: 'Model', value: nafModel || r?.vehicle?.model || '—' },
            { label: 'Year', value: nafYear || r?.vehicle?.year?.toString() || '—' },
            { label: 'Body', value: nafBodyType || '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
      <SectionBlock title="Damage Selector">
        <DamageSelector bodyType={nafBodyType} damaged={damagedPanels} onToggle={togglePanel} description={damageDescription} onDescriptionChange={setDamageDescription} />
      </SectionBlock>
    </>
  );
}
