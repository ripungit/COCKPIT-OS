import { CanActivate, ExecutionContext } from '@nestjs/common';
import { CocktailService } from './cocktail.service';
export declare class CocktailAuthGuard implements CanActivate {
    private readonly cocktailService;
    constructor(cocktailService: CocktailService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
