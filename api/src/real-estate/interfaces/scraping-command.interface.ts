export interface IScrapingCommand {
  execute(): Promise<any>;
  undo?(): Promise<void>;
}

export interface IScrapingCommandFactory {
  createScrapePageCommand(
    url: string,
    options?: Record<string, unknown>,
  ): IScrapingCommand;
  createScrapeSourceCommand(
    source: string,
    baseUrl: string,
    options: any,
  ): IScrapingCommand;
}
