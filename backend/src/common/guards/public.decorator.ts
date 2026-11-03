import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// Marks a route as accessible without the X-API-Key header
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
