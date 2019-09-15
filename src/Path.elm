module Path exposing (..)

import Fs


toAbsolute : Fs.Path -> Fs.Path -> Maybe Fs.AbsolutePath
toAbsolute current path =
    let
        rev revPath =
            case revPath of
                [] ->
                    Just []

                "." :: tail ->
                    rev tail

                ".." :: tail ->
                    rev tail |> Maybe.andThen List.tail

                other :: tail ->
                    rev tail |> Maybe.andThen (\succes -> Just (other :: succes))
    in
    if List.head path == Just "" then
        path |> List.reverse |> rev |> Maybe.map List.reverse

    else
        List.append current path |> List.reverse |> rev |> Maybe.map List.reverse
