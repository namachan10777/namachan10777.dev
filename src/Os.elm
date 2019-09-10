module Os exposing (..)


type alias Id =
    String


type alias Path =
    List String


type alias AbsolutePath =
    List String


type Fs
    = Dir ( String, List Fs )
    | File ( String, Id )


getFileName : Fs -> String
getFileName fs =
    case fs of
        Dir ( name, _ ) ->
            name

        File ( name, _ ) ->
            name


changeFileName : Fs -> String -> Fs
changeFileName fs name =
    case fs of
        Dir ( _, children ) ->
            Dir ( name, children )

        File ( _, id ) ->
            File ( name, id )


includeAsSubdir : AbsolutePath -> AbsolutePath -> Bool
includeAsSubdir src dest =
    List.map2 (==) src dest |> List.foldl (&&) True


normalizePathRev : List String -> Maybe AbsolutePath
normalizePathRev path =
    case path of
        [] ->
            Just []

        "." :: tail ->
            normalizePathRev tail

        ".." :: tail ->
            normalizePathRev tail |> Maybe.andThen List.tail

        other :: tail ->
            normalizePathRev tail |> Maybe.andThen (\succes -> Just (other :: succes))


normalizePath : Path -> Maybe AbsolutePath
normalizePath path =
    path |> List.reverse |> normalizePathRev |> Maybe.map List.reverse


toAbsolutePath : System -> String -> Maybe AbsolutePath
toAbsolutePath system path =
    path |> String.split "/" |> List.append system.current |> normalizePath


type alias System =
    { root : Fs
    , current : AbsolutePath
    }


exePath : String
exePath =
    "/usr/bin/"


initialFs : Fs
initialFs =
    Dir
        ( ""
        , [ Dir
                ( "usr"
                , [ Dir
                        ( "bin"
                        , [ File ( "echo", "echo" )
                          , File ( "cat", "cat" )
                          , File ( "mv", "mv" )
                          , File ( "rm", "rm" )
                          , File ( "cd", "cd" )
                          , File ( "ls", "ls" )
                          , File ( "pwd", "pwd" )
                          ]
                        )
                  ]
                )
          , Dir
                ( "home"
                , [ Dir
                        ( "namachan"
                        , [ File ( "icon", "icon" )
                          , File ( "basic-info", "basic-info" )
                          ]
                        )
                  ]
                )
          ]
        )


initialSystem : System
initialSystem =
    { root = initialFs
    , current = [ "" ]
    }


queryPathAbs : Fs -> AbsolutePath -> Maybe Fs
queryPathAbs fs path =
    case path of
        -- unreachable
        [] ->
            Nothing

        -- unreachable
        "." :: _ ->
            Nothing

        -- unreachable
        ".." :: _ ->
            Nothing

        name :: [] ->
            case fs of
                (File ( fname, _ )) as f ->
                    if name == fname then
                        Just f

                    else
                        Nothing

                (Dir ( dname, _ )) as d ->
                    if name == dname then
                        Just d

                    else
                        Nothing

        name :: tail ->
            case fs of
                File _ ->
                    Nothing

                Dir ( dname, children ) ->
                    if name == dname then
                        children
                            |> List.map (\child -> queryPathAbs child tail)
                            |> List.filterMap identity
                            |> List.head

                    else
                        Nothing


getAbsPath : System -> Path -> Maybe AbsolutePath
getAbsPath system path =
    case path of
        "" :: _ ->
            normalizePath path

        _ ->
            normalizePath (List.append system.current path)


queryPath : System -> Path -> Maybe ( Fs, AbsolutePath )
queryPath system path =
    path |> getAbsPath system |> Maybe.andThen (\p -> queryPathAbs system.root p |> Maybe.map (\fs -> ( fs, p )))


type Resolved
    = Succes ( Fs, AbsolutePath )
    | IsNotDir ( Fs, AbsolutePath )
    | NotFound


resolvePath : System -> String -> Resolved
resolvePath system path =
    let
        ( dirExpect, shrinked ) =
            if String.endsWith "/" path then
                ( True, String.dropRight 1 path )

            else
                ( False, path )
    in
    case ( dirExpect, shrinked |> String.split "/" |> queryPath system ) of
        ( True, Just ( (File _) as f, p ) ) ->
            IsNotDir ( f, p )

        ( True, Just ( (Dir _) as d, p ) ) ->
            Succes ( d, p )

        ( _, Just ( f, p ) ) ->
            Succes ( f, p )

        ( _, Nothing ) ->
            NotFound


resolveExe : System -> String -> Resolved
resolveExe system path =
    if String.startsWith "." path || String.startsWith "/" path then
        resolvePath system path

    else if String.length path > 0 && not (String.contains "/" path) then
        resolvePath system (String.append exePath path)

    else
        NotFound


removeFile : AbsolutePath -> Fs -> Fs
removeFile path =
    fsUpdate identity (path |> List.reverse |> List.head |> Maybe.withDefault "") (path |> dropRight 1)


overwriteFile : AbsolutePath -> Fs -> Fs -> Fs
overwriteFile path src dest =
    fsUpdate (\l -> src :: l) (getFileName src) path dest


fsUpdate : (List Fs -> List Fs) -> String -> AbsolutePath -> Fs -> Fs
fsUpdate f target path dest =
    case path of
        [] ->
            dest

        name :: [] ->
            case dest of
                File _ ->
                    dest

                Dir ( dname, children ) ->
                    if dname == name then
                        Dir
                            ( dname
                            , f
                                (children
                                    |> List.filterMap
                                        (\child ->
                                            if target == getFileName child then
                                                Nothing

                                            else
                                                Just child
                                        )
                                )
                            )

                    else
                        dest

        name :: tail ->
            case dest of
                File _ ->
                    dest

                Dir ( dname, children ) ->
                    if dname == name then
                        Dir
                            ( dname
                            , children
                                |> List.map
                                    (\child ->
                                        if target == getFileName child then
                                            fsUpdate f target tail child

                                        else
                                            child
                                    )
                            )

                    else
                        dest


type
    Output
    -- class src author
    = Img ( String, String, Maybe ( String, String ) )
    | Str String


type CmdResult
    = Stdout (List Output)
    | NoCmd
    | Clear


execEcho : System -> List String -> ( CmdResult, System )
execEcho system args =
    ( Stdout [ Str (String.join " " args) ], system )


execCat : System -> List String -> ( CmdResult, System )
execCat system args =
    args
        |> List.map
            (\arg ->
                case resolvePath system arg of
                    Succes ( File ( fname, id ), p ) ->
                        case id of
                            "basic-info" ->
                                Str "Nakano Masaki<namachan10777@gmail.com\n"

                            "icon" ->
                                Img ( "icon", "./res/icon.jpg", Just ( "@hsm_hx", "https://twitter.com/hsm_hx" ) )

                            _ ->
                                Str (String.append fname " is not a text file\n")

                    Succes ( Dir ( dname, _ ), p ) ->
                        Str (String.append dname " is a directory\n")

                    IsNotDir ( File ( fname, id ), p ) ->
                        Str (String.append fname " is not a directory\n")

                    _ ->
                        Str (String.append arg " is not found\n")
            )
        |> (\outputs -> ( Stdout outputs, system ))


dropRight : Int -> List a -> List a
dropRight n l =
    l |> List.reverse |> List.drop n |> List.reverse


mvImpl : System -> String -> String -> ( Maybe Output, System )
mvImpl system src dest =
    case ( resolvePath system src, resolvePath system dest ) of
        ( NotFound, _ ) ->
            ( Just (Str ("mv: cannot stat " ++ src ++ ": No such file or directory")), system )

        ( IsNotDir _, _ ) ->
            ( Just (Str ("mv: cannot stat " ++ src ++ ": Not a directory")), system )

        ( Succes ( Dir _, _ ), Succes ( File _, _ ) ) ->
            ( Just (Str ("mv: cannot overwrte non-directory " ++ dest ++ ": with directory" ++ src)), system )

        ( Succes ( file, srcAbs ), IsNotDir _ ) ->
            ( Just (Str ("mv: failed to acces" ++ dest ++ ": Not a directory")), system )

        ( Succes ( file, srcAbs ), Succes ( Dir _, destAbs ) ) ->
            ( Nothing, { system | root = overwriteFile destAbs file system.root } )

        ( Succes ( file, srcAbs ), Succes ( File ( name, _ ), destAbs ) ) ->
            ( Nothing
            , { system
                | root =
                    system.root
                        |> overwriteFile (dropRight 1 destAbs) (changeFileName file name)
                        |> removeFile srcAbs
              }
            )

        ( Succes ( file, srcAbs ), _ ) ->
            case getAbsPath system (String.split "/" dest) of
                Nothing ->
                    ( Just (Str ("mv: failed to acces " ++ dest ++ ": No such a directory")), system )

                Just destAbs ->
                    let
                        name =
                            destAbs |> List.reverse |> List.head |> Maybe.withDefault ""
                    in
                    ( Nothing
                    , { system
                        | root =
                            system.root
                                |> overwriteFile (dropRight 1 destAbs) (changeFileName file name)
                                |> removeFile srcAbs
                      }
                    )


execMv : System -> List String -> ( CmdResult, System )
execMv system args =
    case List.reverse args of
        [] ->
            ( Stdout [ Str "mv: missing file operand" ], system )

        src :: [] ->
            ( Stdout [ Str ("mv: missing file destination operand after " ++ src) ], system )

        dest :: src :: [] ->
            let
                ( output, updatedSystem ) =
                    mvImpl system src dest
            in
            ( Stdout ([ output ] |> List.filterMap identity), updatedSystem )

        _ ->
            ( NoCmd, system )


execRm : System -> List String -> ( CmdResult, System )
execRm system _ =
    ( NoCmd, system )


execCd : System -> List String -> ( CmdResult, System )
execCd system arg =
    let
        implCd path =
            case resolvePath system path of
                Succes ( Dir ( _, _ ), normalized ) ->
                    ( Stdout [], { root = system.root, current = normalized } )

                NotFound ->
                    ( Stdout [ Str (path ++ " is not found") ], system )

                _ ->
                    ( Stdout [ Str (path ++ " is not a directory") ], system )
    in
    case arg of
        [] ->
            implCd "/home/namachan/"

        path :: [] ->
            implCd path

        _ ->
            ( Stdout [ Str "Too many args for cd" ], system )


execLs : System -> List String -> ( CmdResult, System )
execLs system paths =
    let
        _ =
            Debug.log "" ( system, paths )

        showDirIncludes path =
            case resolvePath system path of
                Succes ( Dir ( _, children ), _ ) ->
                    children
                        |> List.map
                            (\child ->
                                case child of
                                    File ( name, _ ) ->
                                        name

                                    Dir ( name, _ ) ->
                                        name
                            )
                        |> String.join " "

                NotFound ->
                    path ++ ": directory not found"

                _ ->
                    path ++ "is not a directory"
    in
    case paths of
        [] ->
            ( Stdout [ Str (showDirIncludes ".") ], system )

        path :: [] ->
            ( Stdout [ Str (showDirIncludes path) ], system )

        _ ->
            ( Stdout
                (paths
                    |> List.map
                        (\path ->
                            [ Str (path ++ ":")
                            , Str (showDirIncludes path)
                            ]
                        )
                    |> List.concat
                )
            , system
            )


execPwd : System -> List String -> ( CmdResult, System )
execPwd system args =
    case args of
        [] ->
            ( Stdout [ Str ((system.current |> String.join "/") ++ "/") ], system )

        _ ->
            ( Stdout [ Str "pwd: Expected 0 args, got 1" ], system )


exec : System -> String -> List String -> ( CmdResult, System )
exec system path args =
    case resolveExe system path of
        Succes ( File ( _, "echo" ), _ ) ->
            execEcho system args

        Succes ( File ( _, "cat" ), _ ) ->
            execCat system args

        Succes ( File ( _, "mv" ), _ ) ->
            execMv system args

        Succes ( File ( _, "rm" ), _ ) ->
            execRm system args

        Succes ( File ( _, "cd" ), _ ) ->
            execCd system args

        Succes ( File ( _, "ls" ), _ ) ->
            execLs system args

        Succes ( File ( _, "pwd" ), _ ) ->
            execPwd system args

        _ ->
            ( NoCmd, system )


enumerateCmds : System -> Path
enumerateCmds system =
    case resolvePath system exePath of
        Succes ( Dir ( _, files ), _ ) ->
            files
                |> List.filterMap
                    (\file ->
                        case file of
                            File ( name, _ ) ->
                                Just name

                            _ ->
                                Nothing
                    )

        _ ->
            []
