module Os exposing (..)

import Fs
import Path


type alias System =
    { root : Fs.Fs
    , current : Fs.AbsolutePath
    }


exePath : String
exePath =
    "/usr/bin/"


initialFs : Fs.Fs
initialFs =
    Fs.Dir
        ""
        [ Fs.Dir
            "usr"
            [ Fs.Dir
                "bin"
                [ Fs.File "echo" "echo"
                , Fs.File "clear" "clear"
                , Fs.File "cat" "cat"
                , Fs.File "mv" "mv"
                , Fs.File "rm" "rm"
                , Fs.File "cp" "cp"
                , Fs.File "cd" "cd"
                , Fs.File "ls" "ls"
                , Fs.File "pwd" "pwd"
                ]
            ]
        , Fs.Dir
            "home"
            [ Fs.Dir
                "namachan"
                [ Fs.File "icon" "icon"
                , Fs.File "name" "name"
                , Fs.File "belongs" "belongs"
                , Fs.File "skills" "skills"
                , Fs.File "works" "works"
                , Fs.File "links" "links"
                , Fs.File "help" "help"
                ]
            ]
        ]


initialSystem : System
initialSystem =
    { root = initialFs
    , current = [ "", "home", "namachan" ]
    }


type Resolved
    = Succes Fs.Fs Fs.AbsolutePath
    | IsNotDir Fs.Fs Fs.AbsolutePath
    | NotFound


resolvePath : System -> String -> Resolved
resolvePath system path =
    let
        ( dirExpect, shrinked ) =
            if String.endsWith "/" path then
                ( True, String.dropRight 1 path )

            else
                ( False, path )

        absPath =
            shrinked
                |> String.split "/"
                |> Path.toAbsolute system.current
                |> Maybe.withDefault []
    in
    case ( dirExpect, Fs.queryPathAbs system.root absPath ) of
        ( True, Just ((Fs.File _ _) as f) ) ->
            IsNotDir f absPath

        ( _, Just f ) ->
            Succes f absPath

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


type
    Output
    -- class src author
    = Img String String (Maybe ( String, String ))
    | Str String
    | A String String


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
                    Succes (Fs.File fname id) p ->
                        case id of
                            "name" ->
                                [ Str "Nakano Masaki<namachan10777@gmail.com\n" ]

                            "icon" ->
                                [ Img "icon" "./res/icon.jpg" (Just ( "@hsm_hx", "https://twitter.com/hsm_hx" )) ]

                            "belongs" ->
                                [ Str " school : National Institute of Techonology, Kagawa College."
                                , Str "  dept. : Electrical & Computer Engineering"
                                , Str " conty. : Japan"
                                , Str "  pref. : Kagawa"
                                , Str "  orgs. : Mechanical System Research Club."
                                , Str "        : Infomation Techonology Research Club."
                                ]

                            "skills" ->
                                [ Str " languages : D, OCaml, Rust, TypeScript, Python, C++, TeX"
                                , Str "        OS : Arch Linux"
                                , Str "       CAD : KiCAD, Inventor, OpenSCAD"
                                , Str "     TOEIC : 765"
                                ]

                            "works" ->
                                [ A "namaco" "https://github.com/namachan10777/namaco"
                                , Str "Morphlogical analyzer"
                                , A "folivora" "https://github.com/namachan10777/folivora"
                                , Str "Ergonomics keyboard"
                                , A "kck" "https://github.com/namachan10777/kck"
                                , Str "C compiler"
                                ]

                            "links" ->
                                [ A "Twitter" "https://twitter.com/namachan10777"
                                , A "hatenablog" "https://namachan10777.hatenablog.com/"
                                , A "GitHub" "https://github.com/namachan10777"
                                , A "Steam" "https://steamcommunity.com/id/namachan10777/"
                                , A "Amazon Wishlist" "http://amzn.asia/6JUD39R"
                                , A "My namecard" "https://namachan10777.github.io/namecard.html"
                                , A "My resume" "https://namachan10777.github.io/resume.html"
                                ]

                            "help" ->
                                [ A "non-interactive page" "./noninteractive.xhtml"
                                , Str "You can use \"cp\", \"mv\", \"cat\", \"ls\", \"cd\" and etc..."
                                , Str "e.g -> cat icon"
                                , Str "e.g -> ls /usr/bin"
                                ]

                            _ ->
                                [ Str (String.append fname " is not a text file\n") ]

                    Succes (Fs.Dir dname _) p ->
                        [ Str (String.append dname " is a directory\n") ]

                    IsNotDir (Fs.File fname id) p ->
                        [ Str (String.append fname " is not a directory\n") ]

                    _ ->
                        [ Str (String.append arg " is not found\n") ]
            )
        |> (\outputs -> ( Stdout (List.concat outputs), system ))


dropRight : Int -> List a -> List a
dropRight n l =
    l |> List.reverse |> List.drop n |> List.reverse


isIncludeAsSubDir : Fs.AbsolutePath -> Fs.AbsolutePath -> Bool
isIncludeAsSubDir src dest =
    List.length src < List.length dest && (List.map2 (==) src dest |> List.foldl (&&) True)


implCp : Bool -> Bool -> Bool -> System -> String -> String -> ( Maybe Output, System )
implCp deleteAfterCopy cpDirectory isSingleArg system src dest =
    let
        cmdName =
            if deleteAfterCopy then
                "mv"

            else
                "cp"

        updater srcPath destPath file root =
            if deleteAfterCopy then
                root |> Fs.overwriteFile destPath file |> Fs.removeFile srcPath

            else
                root |> Fs.overwriteFile destPath file
    in
    case ( isSingleArg, resolvePath system src, resolvePath system dest ) of
        ( _, NotFound, _ ) ->
            ( Just (Str (cmdName ++ ": cannot stat " ++ src ++ ": No such file or directory")), system )

        ( _, IsNotDir _ _, _ ) ->
            ( Just (Str (cmdName ++ ": cannot stat " ++ src ++ ": Not a directory")), system )

        ( _, Succes (Fs.Dir _ _) _, Succes (Fs.File _ _) _ ) ->
            ( Just (Str (cmdName ++ ": cannot overwrte non-directory " ++ dest ++ ": with directory" ++ src)), system )

        ( _, Succes file srcAbs, IsNotDir _ _ ) ->
            ( Just (Str (cmdName ++ ": failed to acces " ++ dest ++ ": Not a directory")), system )

        ( False, _, Succes (Fs.File _ _) _ ) ->
            ( Just (Str (cmdName ++ ": target " ++ dest ++ " is not a directory")), system )

        ( False, _, NotFound ) ->
            ( Just (Str (cmdName ++ ": failed to acces " ++ dest ++ ": Not a directory")), system )

        ( _, Succes file srcAbs, Succes (Fs.Dir _ _) destAbs ) ->
            if deleteAfterCopy && isIncludeAsSubDir srcAbs destAbs then
                ( Just (Str (cmdName ++ ": cannot move " ++ src ++ " to a subdirectory of itself, " ++ dest)), system )

            else if Fs.isDir file && not cpDirectory then
                ( Just (Str (cmdName ++ ": -r not specified; omitting directory " ++ src)), system )

            else
                ( Nothing, { system | root = system.root |> updater srcAbs destAbs file } )

        ( _, Succes file srcAbs, Succes (Fs.File name _) destAbs ) ->
            if isIncludeAsSubDir srcAbs destAbs then
                ( Just (Str (cmdName ++ ": cannot move " ++ src ++ " to a subdirectory of itself, " ++ dest)), system )

            else
                ( Nothing
                , { system
                    | root =
                        system.root
                            |> updater srcAbs (dropRight 1 destAbs) (Fs.changeName file name)
                  }
                )

        ( _, Succes file srcAbs, _ ) ->
            case Path.toAbsolute system.current (String.split "/" dest) of
                Nothing ->
                    ( Just (Str (cmdName ++ ": failed to acces " ++ dest ++ ": No such a directory")), system )

                Just destAbs ->
                    let
                        name =
                            destAbs |> List.reverse |> List.head |> Maybe.withDefault ""
                    in
                    if isIncludeAsSubDir srcAbs destAbs then
                        ( Just (Str (": cannot move " ++ src ++ " to a subdirectory of itself, " ++ dest)), system )

                    else if Fs.isDir file && not cpDirectory then
                        ( Just (Str (cmdName ++ ": -r not specified; omitting directory " ++ src)), system )

                    else
                        ( Nothing
                        , { system
                            | root =
                                system.root
                                    |> updater srcAbs (dropRight 1 destAbs) (Fs.changeName file name)
                          }
                        )


execCp : Bool -> System -> List String -> ( CmdResult, System )
execCp deleteAfterCopy system args =
    let
        cmdName =
            if deleteAfterCopy then
                "mv"

            else
                "cp"

        cpDirectory =
            deleteAfterCopy || List.member "-r" args

        cmdArgs =
            if deleteAfterCopy then
                args

            else
                List.filter (\s -> s /= "-r") args
    in
    case List.reverse cmdArgs of
        [] ->
            ( Stdout [ Str (cmdName ++ ": missing file operand") ], system )

        src :: [] ->
            ( Stdout [ Str (cmdName ++ ": missing file destination operand after " ++ src) ], system )

        dest :: src :: [] ->
            let
                ( output, updatedSystem ) =
                    implCp deleteAfterCopy cpDirectory True system src dest
            in
            ( Stdout ([ output ] |> List.filterMap identity), updatedSystem )

        dest :: srcs ->
            let
                ( outputs, updatedSystem ) =
                    srcs
                        |> List.reverse
                        |> List.foldl
                            (\src ( acc, sys ) ->
                                let
                                    ( output, nextSys ) =
                                        implCp deleteAfterCopy cpDirectory False sys src dest
                                in
                                ( output :: acc, nextSys )
                            )
                            ( [], system )
            in
            ( Stdout (outputs |> List.filterMap identity), updatedSystem )


execRm : System -> List String -> ( CmdResult, System )
execRm system args =
    let
        rmRecurse =
            List.member "-r" args

        cmdArgs =
            List.filter (\s -> s /= "-r") args
    in
    cmdArgs
        |> List.foldl
            (\target ( acc, sys ) ->
                case ( rmRecurse, resolvePath sys target ) of
                    ( False, Succes (Fs.Dir _ _) _ ) ->
                        ( Str ("rm: cannot remove " ++ target ++ ": Is not a directory") :: acc, sys )

                    ( _, Succes _ path ) ->
                        ( acc, { sys | root = sys.root |> Fs.removeFile path } )

                    ( _, IsNotDir _ _ ) ->
                        ( Str ("rm: cannot remove " ++ target ++ ": Not a directory") :: acc, sys )

                    ( _, NotFound ) ->
                        ( Str ("rm: cannot remove " ++ target ++ ": No such file or directory") :: acc, sys )
            )
            ( [], system )
        |> (\( acc, sys ) -> ( Stdout acc, sys ))


execCd : System -> List String -> ( CmdResult, System )
execCd system arg =
    let
        implCd path =
            case resolvePath system path of
                Succes (Fs.Dir _ _) normalized ->
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
        showDirIncludes path =
            case resolvePath system path of
                Succes (Fs.Dir _ children) _ ->
                    children
                        |> List.map
                            (\child ->
                                case child of
                                    Fs.File name _ ->
                                        name

                                    Fs.Dir name _ ->
                                        name
                            )
                        |> String.join " "

                NotFound ->
                    path ++ ": directory not found"

                _ ->
                    path ++ " is not a directory"
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


execClear : System -> List String -> ( CmdResult, System )
execClear system args =
    case args of
        [] ->
            ( Clear, system )

        _ ->
            ( Stdout [ Str "clear: Expected 0 args, got 1" ], system )


exec : System -> String -> List String -> ( CmdResult, System )
exec system path args =
    (case resolveExe system path of
        Succes (Fs.File _ "echo") _ ->
            execEcho

        Succes (Fs.File _ "clear") _ ->
            execClear

        Succes (Fs.File _ "cat") _ ->
            execCat

        Succes (Fs.File _ "cp") _ ->
            execCp False

        Succes (Fs.File _ "mv") _ ->
            execCp True

        Succes (Fs.File _ "rm") _ ->
            execRm

        Succes (Fs.File _ "cd") _ ->
            execCd

        Succes (Fs.File _ "ls") _ ->
            execLs

        Succes (Fs.File _ "pwd") _ ->
            execPwd

        _ ->
            \_ _ -> ( NoCmd, system )
    )
        system
        args
