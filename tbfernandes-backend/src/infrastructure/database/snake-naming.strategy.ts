import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';

const snake = (value: string) =>
  value.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();

export class SnakeNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  override columnName(
    propertyName: string,
    customName: string | undefined,
    prefixes: string[],
  ): string {
    return customName ?? snake([...prefixes, propertyName].join('_'));
  }

  override relationName(propertyName: string): string {
    return snake(propertyName);
  }

  override joinColumnName(
    relationName: string,
    referencedColumnName: string,
  ): string {
    return snake(`${relationName}_${referencedColumnName}`);
  }
}
