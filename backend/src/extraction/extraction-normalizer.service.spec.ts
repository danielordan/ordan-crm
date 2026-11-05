import { ExtractionNormalizerService } from './extraction-normalizer.service';
import type { ExtractedData } from './extraction.schema';

const data: ExtractedData = {
  companyName: 'Acme Trading Ltd',
  address: '1 Port Rd',
  phone: '+972 3 555 1234',
  email: 'info@acme.com',
  originPort: 'Shanghai',
  originCountry: 'China',
  destinationPort: 'Haifa',
  incoterms: 'FOB',
  shipmentType: 'FCL',
};

describe('ExtractionNormalizerService', () => {
  const normalizer = new ExtractionNormalizerService();

  it('keeps values as they appear in the document', () => {
    expect(normalizer.normalize(data)).toEqual(data);
  });

  it('collapses whitespace and line breaks', () => {
    expect(normalizer.normalize({ ...data, address: '  1 Port Rd,\n  Haifa  ' }).address).toBe(
      '1 Port Rd, Haifa',
    );
  });

  it.each(['', '   ', '\n'])('turns blank text %j into null', (blank) => {
    expect(normalizer.normalize({ ...data, email: blank }).email).toBeNull();
  });

  it('removes NUL characters, which PostgreSQL cannot store', () => {
    expect(normalizer.normalize({ ...data, incoterms: 'F\0OB\0' }).incoterms).toBe('F OB');
  });

  it('does not validate or change the email format', () => {
    expect(normalizer.normalize({ ...data, email: 'not-an-email' }).email).toBe('not-an-email');
  });

  it.each([
    'TO ORDER',
    'to order',
    'TO ORDER OF ABC BANK',
    'TO THE ORDER OF ABC BANK',
    'To  The Order Of X',
  ])('treats the consignee %j as a missing company name', (companyName) => {
    expect(normalizer.normalize({ ...data, companyName }).companyName).toBeNull();
  });

  it.each(['Tomorrow Trading', 'Order To Go Ltd', 'TO ORDERLY LTD'])(
    'keeps the company name %j',
    (companyName) => {
      expect(normalizer.normalize({ ...data, companyName }).companyName).toBe(companyName);
    },
  );
});
