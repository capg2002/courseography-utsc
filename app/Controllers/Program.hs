module Controllers.Program (index, retrieveProgram, programCodesResponse) where

import Config (runDb)
import Control.Monad.IO.Class (liftIO)
import qualified Data.Set as S
import Database.Persist (Entity)
import Database.Persist.Sqlite (SqlPersistM, entityVal, selectList)
import Database.Tables as Tables (Program, programCode, programModified)
import Happstack.Server (Request, Response, ServerPart, askRq, ifModifiedSince, lookText',
                         toResponse)
import Models.Program (returnProgram)
import Util.Happstack (createJSONResponse)
import qualified Data.Text as T (Text, null, strip, unlines, pack)
import System.Directory (doesDirectoryExist, listDirectory)
import System.FilePath (takeBaseName, takeExtension, (</>))
import Data.List (sort)

-- | Builds a list of all program codes in the database
index :: ServerPart Response
index = do
    response <- liftIO $ runDb $ do
        programsList :: [Entity Program] <- selectList [] []
        let codes = map (programCode . entityVal) programsList
            rmEmpty = filter (not . T.null . T.strip) codes
            rmDups = S.toList (S.fromList rmEmpty)
        return $ T.unlines rmDups :: SqlPersistM T.Text
    return $ toResponse response

-- | Takes a http request with a program code and sends a JSON response containing the program data
-- | if the program data has been modified since the timestamp in the request,
-- | or a 304 "Not Modified" response otherwise
retrieveProgram :: ServerPart Response
retrieveProgram = do
    req <- askRq
    code <- lookText' "code"
    liftIO $ queryProgram req code

-- | Queries the database for the program data then returns a JSON response of it
-- | if the program data has been modified since the timestamp in the request,
-- | or a 304 "Not Modified" response otherwise
queryProgram :: Request -> T.Text -> IO Response
queryProgram req code = do
    programMaybe <- returnProgram code
    case programMaybe of
        Nothing -> return $ createJSONResponse (Nothing :: Maybe Program)
        Just program -> return $ ifModifiedSince (programModified program) req (createJSONResponse program)

-- | Lists program codes based on which journey JSON files exist on disk.
-- | Returns plain text with one code per line
programCodesResponse :: ServerPart Response
programCodesResponse = do
    liftIO $ putStrLn ("[program-codes] journeyJsonDir = " ++ journeyJsonDir)
    exists <- liftIO $ doesDirectoryExist journeyJsonDir
    liftIO $ putStrLn ("[program-codes] dir exists? " ++ show exists)

    codes <- liftIO getProgramCodesFromJourneyJson
    liftIO $ putStrLn ("[program-codes] codes found: " ++ show (length codes))

    return $ toResponse (T.unlines (map T.pack codes))

journeyJsonDir :: FilePath
journeyJsonDir = "journeys_1"

getProgramCodesFromJourneyJson :: IO [String]
getProgramCodesFromJourneyJson = do
    exists <- doesDirectoryExist journeyJsonDir
    if not exists
      then return []
      else do
        files <- listDirectory journeyJsonDir
        let codes =
              [ takeBaseName f
              | f <- files
              , takeExtension f == ".json"
              ]
        return (sort codes)