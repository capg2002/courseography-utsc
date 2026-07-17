{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE DeriveGeneric #-}

module DynamicGraphs.GraphGenerator
  ( sampleGraph
  , coursesToPrereqGraph
  , coursesToPrereqGraphExcluding
  , graphProfileHash
  , journeyToGraph                 
  , journeyProfileHash             
  )
  where

import Control.Monad.State (State)
import qualified Control.Monad.State as State
import Css.Constants (nodeFontSize)
import Data.Containers.ListUtils (nubOrd)
import Data.Foldable (toList)
import Data.Graph (Tree (Node))
import Data.GraphViz.Attributes as A
import Data.GraphViz.Attributes.Complete as AC
import Data.GraphViz.Types.Generalised (DotEdge (..), DotGraph (..), DotNode (..),
                                        DotStatement (..), GlobalAttributes (..))
import Data.GraphViz.Types.Generalised
import qualified Data.Char as Char
import qualified Data.Hash.MD5 as MD5
import Data.List (elemIndex)
import qualified Data.List as List
import qualified Data.Map.Strict as Map
import qualified Data.Set as Set
import Data.Maybe (fromMaybe, mapMaybe)
import Data.Sequence as Seq
import Data.Text.Lazy (Text, concat, isInfixOf, isPrefixOf, last, pack, take, unpack)
import Database.Requirement (Modifier (..), Req (..))
import DynamicGraphs.CourseFinder (lookupCourses)
import DynamicGraphs.GraphNodeUtils (formatModOr, maybeHead, paddingSpaces, stringifyModAnd)
import DynamicGraphs.GraphOptions (GraphOptions (..), defaultGraphOptions)
import Prelude hiding (last)
import Debug.Trace (traceShow)

import Data.Aeson (FromJSON(..), withObject, (.:), (.:?))
import qualified Data.Aeson as Aeson
import qualified Data.ByteString.Lazy as BL
import GHC.Generics (Generic)

import qualified Data.Text as TS
import qualified Data.Text.Lazy as TL

import Data.GraphViz.Types.Generalised (DotSubGraph(..))
import Models.Course (prereqsForCourse)

-- | Generates a DotGraph dependency graph including all the given courses and their recursive dependecies
coursesToPrereqGraph :: [String] -- ^ courses to generate
                        -> IO (DotGraph Text)
coursesToPrereqGraph rootCourses = coursesToPrereqGraphExcluding (map pack rootCourses) defaultGraphOptions

-- | Takes a list of courses we wish to generate a dependency graph for, along with graph options
-- for the courses we want to include. The generated graph will not contain the dependencies of the courses
-- from excluded departments. In addition, it will neither include any of the taken courses,
-- nor the dependencies of taken courses (unless they are depended on by other courses)
coursesToPrereqGraphExcluding :: [Text] -> GraphOptions -> IO (DotGraph Text)
coursesToPrereqGraphExcluding rootCourses options = do
    reqs <- lookupCourses options rootCourses
    let reqs' = Map.toList reqs
    return $ fst $ State.runState (reqsToGraph options reqs') initialState
    where
        initialState = GeneratorState 0 Map.empty

sampleGraph :: DotGraph Text
sampleGraph = fst $ State.runState (reqsToGraph
    defaultGraphOptions
    [("MAT237H1", J "MAT137H1" ""),
    ("MAT133H1", None),
    ("CSC148H1", ReqAnd [J "CSC108H1" "", J "CSC104H1" ""]),
    ("CSC265H1", ReqAnd [J "CSC148H1" "", J "CSC236H1" ""])
    ])
    (GeneratorState 0 Map.empty)

-- ** Main algorithm for converting requirements into a DotGraph

-- | Convert a list of coursenames and requirements to a DotGraph object for
--  drawing using Dot. Also prunes any repeated edges that arise from
--  multiple Reqs using the same Grade requirement
reqsToGraph :: GraphOptions -> [(Text, Req)] -> State GeneratorState (DotGraph Text)
reqsToGraph options reqs = do
    allStmts <- concatUnique <$> mapM (reqToStmts options) reqs
    return $ buildGraph allStmts
    where
        concatUnique = nubOrd . Prelude.concat

data GeneratorState = GeneratorState Integer (Map.Map Text (DotNode Text))

pickCourse :: GraphOptions -> Text -> Bool
pickCourse options name =
    pickCourseByDepartment options name &&
    pickCourseByLocation options name

pickCourseByDepartment :: GraphOptions -> Text -> Bool
pickCourseByDepartment options name =
    Prelude.null (departments options) ||
    prefixedByOneOf name (departments options)

pickCourseByLocation :: GraphOptions -> Text -> Bool
pickCourseByLocation options name =
    Prelude.null (location options) ||
    courseLocation `elem` mapMaybe locationNum (location options)
    where
        courseLocation = last name
        locationNum l = case l of
            "utsg" -> Just '1'
            "utsc" -> Just '3'
            "utm" -> Just '5'
            _ -> Nothing

nodeColor :: GraphOptions -> Text -> Color
nodeColor options name = colors !! depIndex
    where colors :: [Color]
          colors = cycle $ map toColor
            [Orchid, Orange, CornFlowerBlue, Salmon, Aquamarine, Yellow, OliveDrab]
          depIndex :: Int
          depIndex = fromMaybe 0 (elemIndex courseDep (departments options))
          courseDep :: Text
          courseDep = Data.Text.Lazy.take 3 name

-- | Convert the original requirement data into dot statements that can be used by buildGraph to create the
-- corresponding DotGraph objects.
reqToStmts :: GraphOptions -> (Text, Req) -> State GeneratorState [DotStatement Text]
reqToStmts options (name, req) = do
    if pickCourse options name
        then do
            node <- makeNode name $ Just (nodeColor options name)
            stmts <- reqToStmtsTree options (nodeID node) req
            return $ DN node:Prelude.concat (toList stmts)
        else return []

reqToStmtsTree :: GraphOptions -- ^ Options to toggle dynamic graph
               -> Text -- ^ Name of parent course
               -> Req  -- ^ Requirement to generate dep tree for
               -> State GeneratorState (Tree [DotStatement Text])
reqToStmtsTree _ _ None = return (Node [] [])
reqToStmtsTree options parentID (J name2 _) = do
    let name = pack name2
    if pickCourse options name then do
        prereq <- makeNode name $ Just (nodeColor options name)
        edge <- makeEdge (nodeID prereq) parentID Nothing
        return (Node [DN prereq, DE edge] [])
    else
        return (Node [] [])
-- Two or more required prerequisites.
reqToStmtsTree options parentID (ReqAnd reqs) = do
    (andNode, _) <- makeBool "and" reqs
    edge <- makeEdge (nodeID andNode) parentID Nothing
    prereqStmts <- mapM (reqToStmtsTree options (nodeID andNode)) reqs
    let filteredStmts = Prelude.filter (Node [] [] /=) prereqStmts
    case filteredStmts of
        [] -> return $ Node [] []
        [Node (DN node:_) xs] -> do
            -- make new edge with parent id and single child id
            newEdge <- makeEdge (nodeID node) parentID Nothing
            return $ Node [DN node, DE newEdge] xs
        _ -> return $ Node [DN andNode, DE edge] filteredStmts
-- A choice from two or more prerequisites.
reqToStmtsTree options parentID (ReqOr reqs) = do
    (orNode, _) <- makeBool "or" reqs
    edge <- makeEdge (nodeID orNode) parentID Nothing
    prereqStmts <- mapM (reqToStmtsTree options (nodeID orNode)) reqs
    let filteredStmts = Prelude.filter (Node [] [] /=) prereqStmts
    case filteredStmts of
        [] -> return $ Node [] []
        [Node (DN node:_) xs] -> do
            -- make new edge with parent id and single child id
            newEdge <- makeEdge (nodeID node) parentID Nothing
            return $ Node [DN node, DE newEdge] xs
        _  -> return $ Node [DN orNode, DE edge] filteredStmts

-- A prerequisite with a grade requirement.
reqToStmtsTree options parentID (Grade description req) = do
    if includeGrades options then do
        Node root rest <- reqToStmtsTree options parentID req
        case root of
            DN gradeNode:_ -> do
                -- make an annotated edge
                gradeEdge <- makeEdge (nodeID gradeNode)
                                      parentID
                                      (Just $ pack $ description ++ "%")
                -- swap out top edge of prereqStmt tree with annotated edge
                return $ Node [DN gradeNode, DE gradeEdge] rest
            _ -> return $ Node [] [] -- ERROR
    else reqToStmtsTree options parentID req

-- A raw string description of a prerequisite.
reqToStmtsTree options parentID (Raw rawText) =
    if not (includeRaws options) || "High school" `isInfixOf` pack rawText || rawText == ""
        then return $ Node [] []
        else do
            prereq <- makeNode (pack rawText) Nothing
            edge <- makeEdge (nodeID prereq) parentID Nothing
            return $ Node [DN prereq, DE edge] []

--A prerequisite concerning a given number of earned credits
reqToStmtsTree _ parentID (Fces creds (Requirement (Raw ""))) = do
    fceNode <- makeNode (pack $ show creds ++ " FCEs") Nothing
    edge <- makeEdge (nodeID fceNode) parentID Nothing
    return $ Node [DN fceNode, DE edge] []

--A prerequisite concerning a given number of earned credits in some raw string
reqToStmtsTree _ parentID (Fces creds (Requirement (Raw text))) = do
    fceNode <- makeNode (pack $ show creds ++ " FCEs from " ++ text ++ paddingSpaces 18) Nothing
    edge <- makeEdge (nodeID fceNode) parentID Nothing
    return $ Node [DN fceNode, DE edge] []

--A prerequisite concerning a given number of earned credits in some course(s)
reqToStmtsTree options parentID (Fces creds (Requirement req)) = do
    fceNode <- makeNode (pack $ show creds ++ " FCEs") Nothing
    edge <- makeEdge (nodeID fceNode) parentID Nothing
    prereqStmts <- reqToStmtsTree options (nodeID fceNode) req
    return $ Node [DN fceNode, DE edge] [prereqStmts]

--A prerequisite concerning a given number of earned credits in a department
reqToStmtsTree _ parentID (Fces creds (Department dept)) = do
    fceNode <- makeNode (pack $ show creds ++ " " ++ dept ++ " FCEs") Nothing
    edge <- makeEdge (nodeID fceNode) parentID Nothing
    return $ Node [DN fceNode, DE edge] []

--A prerequisite concerning a given number of earned credits at a given level
reqToStmtsTree _ parentID (Fces creds (Level level)) = do
    fceNode <- makeNode (pack $ show creds ++ " FCEs at the " ++ level ++ " level" ++ paddingSpaces 18) Nothing
    edge <- makeEdge (nodeID fceNode) parentID Nothing
    return $ Node [DN fceNode, DE edge] []

-- | A prerequisite concerning a given number of earned credits with a combination
-- | of some modifiers related through ModAnds
-- | Assumes each modifier constructor appears in modifiers at most once
-- | The ModOr constructor may appear more than once, but each occurrence
-- | of ModOr contains exactly one constructor for all its elements
-- | and such constructor does not appear anywhere else in ModAnd
reqToStmtsTree options parentID (Fces creds (ModAnd modifiers)) = do
    fceNode <- makeNode (pack $ stringifyModAnd creds modifiers ++ paddingSpaces 10) Nothing
    edge <- makeEdge (nodeID fceNode) parentID Nothing

    case maybeHead [req | Requirement req <- modifiers] of
        Nothing -> return $ Node [DN fceNode, DE edge] []
        Just req -> do
            prereqStmts <- reqToStmtsTree options (nodeID fceNode) req
            return $ Node [DN fceNode, DE edge] [prereqStmts]

-- | A prerequisite concerning a given number of earned credits with a combination
-- | of some modifiers related through a ModOr
-- | Assumes all modifiers in the list have the same constructor
reqToStmtsTree options parentID (Fces creds (ModOr modifiers)) = do
    fceNode <- makeNode (pack $ formatModOr creds modifiers) Nothing
    edge <- makeEdge (nodeID fceNode) parentID Nothing

    case maybeHead [req | Requirement req <- modifiers] of
        Nothing -> return $ Node [DN fceNode, DE edge] []
        Just req -> do
            prereqStmts <- reqToStmtsTree options (nodeID fceNode) req
            return $ Node [DN fceNode, DE edge] [prereqStmts]

-- A program requirement
reqToStmtsTree _ parentID (Program prog) = do
    -- FIXME: weird width calculation from the library with the prog
    -- so we padded the string with prog again to work around it
    progNode <- makeNode (pack $ "Enrolled in " ++ prog ++ Prelude.replicate (Prelude.length prog) ' ') Nothing
    edge <- makeEdge (nodeID progNode) parentID Nothing
    return $ Node [DN progNode, DE edge] []

-- a cGPA requirement
reqToStmtsTree _ parentID (Gpa float string) = do
    gpaNode <- makeNode (pack $ "Minimum cGPA of " ++ show float ++ string) Nothing
    edge <-  makeEdge (nodeID gpaNode) parentID Nothing
    return $ Node [DN gpaNode, DE edge] []

prefixedByOneOf :: Text -> [Text] -> Bool
prefixedByOneOf name = any (`isPrefixOf` name)

makeNode :: Text -> Maybe Color -> State GeneratorState (DotNode Text)
makeNode name nodeCol = do
    GeneratorState i nodesMap <- State.get
    case Map.lookup name nodesMap of
        Nothing -> do
            let nodeId = mappendTextWithCounter name i
                actualColor = case nodeCol of
                    Nothing -> toColor Gray
                    Just c -> c
                node = DotNode nodeId
                               [AC.Label $ toLabelValue name,
                                ID nodeId,
                                AC.FixedSize AC.GrowAsNeeded,
                                AC.FontSize nodeFontSize,
                                FillColor $ toColorList [actualColor]]
                nodesMap' = Map.insert name node nodesMap
            State.put (GeneratorState (i + 1) nodesMap')
            return node
        Just node -> return node

makeBool :: Text -> [Req] -> State GeneratorState (DotNode Text, Text)
makeBool text1 reqs = do
    GeneratorState i boolsMap <- State.get
    reqsList <- mapM generateBoolKey reqs
    let sortedList = toList (sort $ fromList reqsList)
    let boolKey = Data.Text.Lazy.concat $ text1 : sortedList
    case Map.lookup boolKey boolsMap of
        Nothing -> do
            let nodeId = mappendTextWithCounter text1 i
            let boolNode = DotNode nodeId
                                    ([AC.Label (toLabelValue text1), ID nodeId] ++ ellipseAttrs)
                boolsMap' = Map.insert boolKey boolNode boolsMap
            State.put (GeneratorState (i + 1) boolsMap')

            return (boolNode, boolKey)
        Just node -> do
            return (node, boolKey)

-- | Create edge from two node ids. Also allow for potential edge label
makeEdge :: Text -> Text -> Maybe Text -> State GeneratorState (DotEdge Text)
makeEdge id1 id2 description =
    return $ DotEdge id1 id2
                     (ID (id1 `mappend` "|" `mappend` id2) : textLabelList)
    where
        textLabelList = case description of
            Nothing -> []
            Just a -> [textLabel a]

mappendTextWithCounter :: Text -> Integer -> Text
mappendTextWithCounter text1 counter = text1 `mappend` "_counter_" `mappend` pack (show counter)

-- | Generates a unique key for each boolean node
-- May generate lower level nodes that make up the boolean node
generateBoolKey :: Req -> State GeneratorState Text
generateBoolKey (J s1 _) = return $ pack ("_" ++ s1)
generateBoolKey (Grade _ req) = do
    generateBoolKey req
generateBoolKey (ReqAnd reqs) = do
    (_, boolKey)<- makeBool "and" reqs
    return $ pack ("_[" ++ unpack boolKey ++ "]")
generateBoolKey (ReqOr reqs) = do
    (_, boolKey) <- makeBool "or" reqs
    return $ pack ("_[" ++ unpack boolKey ++ "]")
generateBoolKey _ = return ""

-- ** Graphviz configuration

-- | With the dot statements converted from original requirement data as input, create the corresponding DotGraph
-- object with predefined hyperparameters (here, the hyperparameters defines that 1.graph can have multi-edges
-- 2.graph edges have directions 3.graphID not defined(not so clear) 4.the graph layout, node shape, edge shape
-- are defined by the attributes as below)
buildGraph :: [DotStatement Text] -> DotGraph Text
buildGraph statements = DotGraph {
    strictGraph = False,
    directedGraph = True,
    graphID = Nothing,
    graphStatements = Seq.fromList $ [
        GA graphAttrs,
        GA nodeAttrs,
        GA edgeAttrs
        ] ++ statements
    }

graphProfileHash :: String
graphProfileHash = MD5.md5s . MD5.Str . show $ (buildGraph [], ellipseAttrs)

-- | Means the layout of the full graph is from left to right.
graphAttrs :: GlobalAttributes
graphAttrs = GraphAttrs
    [ AC.RankDir AC.FromTop
    , AC.Splines AC.Ortho
    , AC.Concentrate False
    ]

nodeAttrs :: GlobalAttributes
nodeAttrs = NodeAttrs
    [ A.shape A.BoxShape
    , AC.FixedSize GrowAsNeeded
    , A.style A.filled
    ]

ellipseAttrs :: A.Attributes
ellipseAttrs =
    [ A.shape A.Ellipse
    , AC.Width 0.20     -- min 0.01
    , AC.Height 0.15    -- min 0.01
    , AC.FixedSize SetNodeSize
    , A.fillColor White
    , AC.FontSize 6.0  -- min 1.0
    ]

edgeAttrs :: GlobalAttributes
edgeAttrs = EdgeAttrs [
    ArrowHead (AType [(ArrMod FilledArrow BothSides, Normal)])
    ]


-- Collect all course codes referenced in a Req (J nodes only)
reqCourseRefs (Raw rawText) =
  let cs = extractCourseCodes rawText
  in traceShow ("RAW:", rawText, "EXTRACTED:", cs) (map TL.pack cs)
reqCourseRefs (J name _)        = [TL.pack name]
reqCourseRefs (ReqAnd rs)       = Prelude.concatMap reqCourseRefs rs
reqCourseRefs (ReqOr rs)        = Prelude.concatMap reqCourseRefs rs
reqCourseRefs (Grade _ r)       = reqCourseRefs r
reqCourseRefs (Fces _ (Requirement r)) = reqCourseRefs r
reqCourseRefs (Raw rawText)              = map TL.pack (extractCourseCodes rawText)
reqCourseRefs _                 = []


data Semester = Semester
  { k       :: Int
  , year    :: Maybe Int
  , term    :: Maybe TS.Text
  , courses :: [TS.Text]
  } deriving (Show, Generic)


instance Aeson.FromJSON Semester where
  parseJSON = withObject "Semester" $ \o -> do
    k  <- o .:  "k"
    y0 <- o .:? "year"
    t0 <- o .:? "term"
    cs <- o .:  "courses"

    let y = fromMaybe (((k - 1) `div` 3) + 1) y0
        t = fromMaybe (termFromK k) t0

    pure $ Semester { k = k, year = Just y, term = Just t, courses = cs }

termFromK :: Int -> TS.Text
termFromK k =
  case (k - 1) `mod` 3 of
    0 -> "Fall"
    1 -> "Winter"
    _ -> "Summer"

data Journey = Journey
  { program   :: TS.Text
  , program_desc :: Maybe TS.Text
  , logp      :: Maybe Aeson.Value
  , semesters :: [Semester]
  } deriving (Show, Generic)

instance Aeson.FromJSON Journey where
  parseJSON = Aeson.withObject "Journey" $ \o -> do
    p   <- o Aeson..:  "program"
    pd  <- o Aeson..:? "program_desc"   
    lp  <- o Aeson..:? "logp"           
    sem <- o Aeson..:  "semesters"
    pure $ Journey p pd lp sem

journeyToGraph ::  Journey -> IO (DotGraph TL.Text)
journeyToGraph (Journey _ progDesc _ sems) = do
  let semsNonEmpty = Prelude.filter (\s -> not (Prelude.null (courses s))) sems
      semsSorted   = List.sortOn k semsNonEmpty
      desc = fromMaybe "" progDesc
      baseStmts = journeyStmts semsSorted

      displayedCourses :: [TL.Text]
      displayedCourses =
        [ TL.fromStrict c
        | Semester _ _ _ cs <- semsSorted
        , c <- cs
        ]

      allowed = Set.fromList displayedCourses

  -- Pull prereqs from DB (via prereq_string parsing)
  reqMap <- lookupCourses defaultGraphOptions displayedCourses

  pr <- prereqsForCourse (TS.pack "MATA37H3")
  case pr of
    Left e -> putStrLn $ "[DEBUG] prereqsForCourse error: " ++ e
    Right (_, s) -> putStrLn $ "[DEBUG] prereq_string(MATA37H3) = " ++ TS.unpack s

  let key = TL.pack "MATA37H3"

  case Map.lookup key reqMap of
    Nothing ->
      putStrLn "[DEBUG] reqMap has NO entry for MATA37H3"
    Just r  -> do
      putStrLn $ "[DEBUG] reqCourseRefs(MATA37H3) = " ++ show (reqCourseRefs r)
 
  let baseStmts   = journeyStmts semsSorted
      prereqEdges = prereqEdgesForJourney allowed reqMap

  pure $ buildGraphJourney (baseStmts ++ prereqEdges)

-- A journey-specific buildGraph (so we can change layout without affecting prereqs)
buildGraphJourney :: [DotStatement TL.Text] -> DotGraph TL.Text
buildGraphJourney statements = DotGraph
  { strictGraph = False
  , directedGraph = True
  , graphID = Nothing
  , graphStatements = Seq.fromList $
      [ GA journeyGraphAttrs
      , GA nodeAttrs       
      , GA edgeAttrs       
      ] ++ statements
  }

journeyGraphAttrs :: GlobalAttributes
journeyGraphAttrs = GraphAttrs
  [ AC.RankDir AC.FromTop
  , AC.Splines AC.Ortho
  , AC.Concentrate False
  , AC.RankSep [1.5]
  , AC.NodeSep 0.7
  ]

journeyStmts :: [Semester] -> [DotStatement TL.Text]
journeyStmts sems =
  let semsNonEmpty = Prelude.filter (\s -> not (Prelude.null (courses s))) sems
      semsSorted   = List.sortOn k semsNonEmpty
      rows         = Prelude.concatMap semesterRowStmts semsSorted
      spine        = semesterSpine semsSorted
  in rows ++ spine

semesterRowStmts :: Semester -> [DotStatement TL.Text]
semesterRowStmts (Semester semK yrM trmM csStrict) =
  let cs  = map TL.fromStrict csStrict

      title = "Semester " <> show semK
      labelTxt = TL.pack title <> TL.replicate 20 " "
      labelId  = TL.pack ("sem_label_" <> show semK)

      labelNode =
        DotNode labelId
          [ AC.Label (toLabelValue labelTxt)
          , ID labelId
          , A.shape A.BoxShape
          , A.style A.filled
          , A.fillColor White
          , A.color White
          , AC.FontSize (nodeFontSize + 2)
          , A.fontColor Black
          ]

      courseNodes =
        map (\c -> DotNode c
          [ AC.Label (toLabelValue c)
          , ID c
          , AC.FontSize nodeFontSize
          ]) cs

      rowEdges =
        case (labelId : cs) of
          (a:b:rest) -> mkInvisChain (a:b:rest)
          _          -> []

      anchorEdges =
        [ DotEdge labelId c
            [ A.style A.invis
            , AC.Weight (Int 1000)
            , AC.MinLen 0
            ]
        | c <- cs
        ]

  in  [ DN labelNode ]
      ++ map DN courseNodes
      ++ map DE (anchorEdges ++ rowEdges)
  
mkInvisChain :: [TL.Text] -> [DotEdge TL.Text]
mkInvisChain (a:b:xs) =
  DotEdge a b
    [ A.style A.invis
    , AC.Weight (Int 100)
    , AC.Constraint False
    ]
  : mkInvisChain (b:xs)
mkInvisChain _ = []

edgesBetween :: Semester -> Semester -> [DotStatement TL.Text]
edgesBetween (Semester _ _ _ aStrict) (Semester _ _ _ bStrict) =
  let a = map TL.fromStrict aStrict
      b = map TL.fromStrict bStrict
  in [ DE (DotEdge x y
        [ ID (x `mappend` "|" `mappend` y)
        , AC.Constraint False
        ])
     | x <- a, y <- b
     ]

journeyProfileHash :: String
journeyProfileHash = MD5.md5s . MD5.Str . show $ (buildGraphJourney [], ellipseAttrs)

semesterSpine :: [Semester] -> [DotStatement TL.Text]
semesterSpine sems =
  let lbl k = TL.pack ("sem_label_" <> show k)
      ks    = map k sems
      pairs = Prelude.zip ks (Prelude.drop 1 ks)
  in [ DE (DotEdge (lbl a) (lbl b) [A.style A.invis, AC.Weight (Int 1000)])
     | (a,b) <- pairs
     ]

prereqEdgesForJourney
  :: Set.Set TL.Text                 -- ^ allowed nodes (journey courses)
  -> Map.Map TL.Text Req              -- ^ from lookupCourses (lazy Text key)
  -> [DotStatement TL.Text]
prereqEdgesForJourney allowed reqMap =
  Prelude.concatMap mkEdges (Map.toList reqMap)
  where
    mkEdges (courseLazy, req) =
      let course = courseLazy        -- already Data.Text.Lazy.Text
          prereqs = reqCourseRefs req
          prereqsInJourney = Prelude.filter (`Set.member` allowed) prereqs
      in [ DE (DotEdge p course [ ID (p `mappend` "|" `mappend` course) ])
         | p <- prereqsInJourney
         ]

extractCourseCodes :: String -> [String]
extractCourseCodes s =
  Set.toList $ Set.fromList $
    [ chunk
    | chunk <- windows7and8 cleaned
    , isCourseCode chunk
    ]
  where
    -- Keep only alphanumerics; everything else becomes a separator but we remove them entirely for scanning
    cleaned = Prelude.filter Char.isAlphaNum (map Char.toUpper s)

-- all contiguous substrings of length 7 and 8
windows7and8 :: String -> [String]
windows7and8 xs =
  windows 7 xs ++ windows 8 xs

windows :: Int -> String -> [String]
windows n xs
  | Prelude.length xs < n = []
  | otherwise             = Prelude.take n xs : windows n (Prelude.tail xs)

isCourseCode :: String -> Bool
isCourseCode x =
  case x of
    -- 4 letters + 2 digits + H/Y + campus digit  (UTSC style)
    [a,b,c,d,e,f,hy,campus] ->
         all Char.isUpper [a,b,c,d]
      && all Char.isDigit [e,f]
      && (hy == 'H' || hy == 'Y')
      && Char.isDigit campus

    -- 3 letters + 3 digits + H/Y + campus digit  (UTSG/UTM style)
    [a,b,c,d,e,f,hy,campus] ->
         all Char.isUpper [a,b,c]
      && all Char.isDigit [d,e,f]
      && (hy == 'H' || hy == 'Y')
      && Char.isDigit campus

    -- 4 letters + 2 digits + H/Y (no campus digit)
    [a,b,c,d,e,f,hy] ->
         all Char.isUpper [a,b,c,d]
      && all Char.isDigit [e,f]
      && (hy == 'H' || hy == 'Y')

    -- 3 letters + 3 digits + H/Y (no campus digit)
    [a,b,c,d,e,f,hy] ->
         all Char.isUpper [a,b,c]
      && all Char.isDigit [d,e,f]
      && (hy == 'H' || hy == 'Y')

    _ -> False