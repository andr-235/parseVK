export type PhotoAnalysisAuthorRecord = {
  id: number;
  vkUserId: number;
};

export interface IPhotoAnalysisAuthorRepository {
  findByVkId(vkUserId: number): Promise<PhotoAnalysisAuthorRecord | null>;
}
