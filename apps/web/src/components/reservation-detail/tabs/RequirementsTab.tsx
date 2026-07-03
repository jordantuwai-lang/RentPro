'use client';
import { useState } from 'react';
import { SectionBlock, R, cinp } from '../shared/styles';

export function RequirementsTab() {
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardType, setCardType] = useState('');

  return (
    <SectionBlock title="Card Details">
      <div style={{ padding: '10px 12px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', marginBottom: '14px', fontSize: '11px', color: '#92400e' }}>
        Card details are stored locally and not transmitted without explicit action.
      </div>
      <R label="Cardholder Name">
        <input style={cinp} value={cardName} onChange={e => setCardName(e.target.value)} placeholder="As it appears on card" />
      </R>
      <R label="Card Type">
        <select style={cinp} value={cardType} onChange={e => setCardType(e.target.value)}>
          <option value="">— Select —</option>
          <option value="Visa">Visa</option>
          <option value="Mastercard">Mastercard</option>
          <option value="Amex">American Express</option>
          <option value="eftpos">eftpos</option>
          <option value="Other">Other</option>
        </select>
      </R>
      <R label="Card Number">
        <input
          style={cinp}
          value={cardNumber}
          onChange={e => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
            setCardNumber(digits.replace(/(.{4})/g, '$1 ').trim());
          }}
          placeholder="•••• •••• •••• ••••"
          maxLength={19}
          inputMode="numeric"
        />
      </R>
      <R label="Expiry">
        <input
          style={{ ...cinp, width: '90px' }}
          value={cardExpiry}
          onChange={e => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 4);
            setCardExpiry(val.length > 2 ? val.slice(0, 2) + '/' + val.slice(2) : val);
          }}
          placeholder="MM/YY"
          maxLength={5}
          inputMode="numeric"
        />
      </R>
      <R label="CVV">
        <input
          style={{ ...cinp, width: '70px' }}
          value={cardCvv}
          onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="•••"
          maxLength={4}
          inputMode="numeric"
          type="password"
        />
      </R>
    </SectionBlock>
  );
}
