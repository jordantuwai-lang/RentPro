'use client';
import { useState } from 'react';
import { useRezForm } from '../ReservationFormContext';
import { SectionBlock, F, inp, grid3 } from '../shared/styles';
import { DocFileSlot } from '../shared/DocFileSlot';

export function DocumentsTab() {
  const {
    rezNumber, authorityToAct, rentalAgreement, reservationStatus, putOnHire, puttingOnHire, onHireError,
    ratePlanType, setRatePlanType, rateCode, setRateCode, rateClass, setRateClass,
    estKms, setEstKms, unit, setUnit, unitDesc, setUnitDesc,
    uploadDocument, removeDocument, uploadingAuthorityToAct, uploadingRentalAgreement, docError,
  } = useRezForm();

  const [showRAModal, setShowRAModal] = useState(false);

  const bothSigned = !!authorityToAct && !!rentalAgreement;
  const onHire = reservationStatus === 'ACTIVE';

  function signDocument(kind: 'authority' | 'agreement') {
    const signedAt = new Date().toLocaleString('en-AU');
    const title = kind === 'authority' ? 'Authority to Act' : 'Rental Agreement';
    const text = `${title}\nReservation: ${rezNumber || 'Pending'}\nSigned electronically on ${signedAt}.`;
    const file = new File([text], `${title} - Signed.txt`, { type: 'text/plain' });
    uploadDocument(kind === 'authority' ? 'authorityToAct' : 'rentalAgreement', file);
    setShowRAModal(false);
  }

  return (
    <>
      <SectionBlock title="Rate & Vehicle">
        <div style={grid3}>
          <F label="Rate plan">
            <select style={inp} value={ratePlanType} onChange={e => setRatePlanType(e.target.value)}>
              <option value="">— Type —</option>
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </F>
          <F label="Rate code"><input style={inp} value={rateCode} onChange={e => setRateCode(e.target.value)} /></F>
          <F label="Rate class">
            <select style={inp} value={rateClass} onChange={e => setRateClass(e.target.value)}>
              <option value="">— Class —</option>
              {['Economy', 'Compact', 'Midsize', 'Standard', 'Fullsize', 'SUV', 'Van'].map(c => <option key={c}>{c}</option>)}
            </select>
          </F>
          <F label="Est. kms"><input style={inp} value={estKms} onChange={e => setEstKms(e.target.value)} /></F>
          <F label="Unit description"><input style={inp} value={unitDesc} onChange={e => setUnitDesc(e.target.value)} placeholder="Vehicle description" /></F>
          <F label="Unit tag"><input style={inp} value={unit} onChange={e => setUnit(e.target.value)} /></F>
        </div>
      </SectionBlock>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', alignItems: 'start' }}>
        <SectionBlock title="Authority to Act">
          <DocFileSlot
            label="Authority to Act"
            desc="Upload the signed Authority to Act document"
            icon="📝"
            val={authorityToAct}
            uploading={uploadingAuthorityToAct}
            onUpload={file => uploadDocument('authorityToAct', file)}
            onRemove={() => removeDocument('authorityToAct')}
          />
        </SectionBlock>
        <SectionBlock title="Rental Agreement">
          <DocFileSlot
            label="Rental Agreement"
            desc="Upload the signed Rental Agreement"
            icon="📃"
            val={rentalAgreement}
            uploading={uploadingRentalAgreement}
            onUpload={file => uploadDocument('rentalAgreement', file)}
            onRemove={() => removeDocument('rentalAgreement')}
          />
        </SectionBlock>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => setShowRAModal(true)}
          disabled={uploadingAuthorityToAct || uploadingRentalAgreement}
          style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#334155', cursor: 'pointer', opacity: (uploadingAuthorityToAct || uploadingRentalAgreement) ? 0.6 : 1 }}
        >
          {(uploadingAuthorityToAct || uploadingRentalAgreement) ? 'Signing…' : '✍️ Sign a document electronically'}
        </button>
        {docError && <span style={{ marginLeft: '10px', fontSize: '12px', color: '#dc2626' }}>{docError}</span>}
      </div>

      {bothSigned && (
        <SectionBlock title="On Hire">
          {onHire ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '22px' }}>✅</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#01ae42' }}>On Hire</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Both documents are signed and the reservation is active.</div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                Both documents are signed. Put this reservation on hire to activate it.
              </div>
              <button
                type="button"
                onClick={putOnHire}
                disabled={puttingOnHire}
                style={{ padding: '8px 24px', fontSize: '13px', fontWeight: 700, background: puttingOnHire ? '#94a3b8' : '#01ae42', color: '#fff', border: 'none', borderRadius: '8px', cursor: puttingOnHire ? 'not-allowed' : 'pointer' }}
              >
                {puttingOnHire ? 'Putting On Hire…' : 'Put On Hire'}
              </button>
              {onHireError && <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '8px' }}>{onHireError}</div>}
            </div>
          )}
        </SectionBlock>
      )}

      {showRAModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowRAModal(false)}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '28px 32px', width: '340px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Sign document</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>Which document would you like to sign?</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => signDocument('authority')} style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600, borderRadius: '8px', border: '2px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', cursor: 'pointer', textAlign: 'left' }}>
                📝 Authority to Act
                <div style={{ fontSize: '12px', fontWeight: 400, color: '#64748b', marginTop: '2px' }}>Sign and save to the Documents tab</div>
              </button>
              <button onClick={() => signDocument('agreement')} style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600, borderRadius: '8px', border: '2px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', cursor: 'pointer', textAlign: 'left' }}>
                📃 Rental Agreement
                <div style={{ fontSize: '12px', fontWeight: 400, color: '#64748b', marginTop: '2px' }}>Sign and save to the Documents tab</div>
              </button>
            </div>
            <button onClick={() => setShowRAModal(false)} style={{ marginTop: '16px', width: '100%', padding: '8px', fontSize: '13px', color: '#64748b', background: 'transparent', border: 'none', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}
