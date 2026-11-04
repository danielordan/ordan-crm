import { updateClientSchema } from './update-client.dto';

describe('updateClientSchema', () => {
  it('keeps values exactly as entered', () => {
    expect(updateClientSchema.parse({ companyName: '  Acme  LTD ' })).toEqual({
      companyName: '  Acme  LTD ',
    });
  });

  it.each(['', '   ', '\t\n'])('turns blank text %j into null', (value) => {
    expect(updateClientSchema.parse({ email: value })).toEqual({ email: null });
  });

  it('accepts null and leaves out fields that were not sent', () => {
    expect(updateClientSchema.parse({ phone: null })).toEqual({ phone: null });
  });

  it.each(['FCL', 'LCL', null])('accepts shipmentType %j', (shipmentType) => {
    expect(updateClientSchema.parse({ shipmentType })).toEqual({ shipmentType });
  });

  it.each([
    ['an empty body', {}],
    ['an unknown field', { processingStatus: 'Success' }],
    ['an invalid shipment type', { shipmentType: 'AIR' }],
    ['a blank shipment type', { shipmentType: '' }],
    ['a value that is not text', { email: 5 }],
    ['a NUL character', { email: 'a\0b' }],
  ])('rejects %s', (_name, body) => {
    expect(updateClientSchema.safeParse(body).success).toBe(false);
  });
});
